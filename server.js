const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
// Serve arquivos estáticos da pasta 'public'
app.use(express.static('public')); 
const server = http.createServer(app);
const PORT = 3000;

const wss = new WebSocket.Server({ server });

let players = [];
let board = Array(6).fill(null).map(() => Array(7).fill(0)); // Tabuleiro 6x7, 0=vazio
let currentPlayerId = 1; // ID do jogador (1 ou 2)
let gameActive = false; // Estado do jogo

const ROWS = 6;
const COLS = 7;

console.log('Servidor WebSocket e HTTP iniciado.');

// --- FUNÇÕES DE LÓGICA DO JOGO ---

/**
 * Verifica se o tabuleiro está cheio (Empate).
 */
function checkDraw() {
    // Verifica se a linha de topo (índice 0) ainda tem slots vazios.
    // Se não houver 0 na linha 0, o tabuleiro está cheio.
    return board[0].every(cell => cell !== 0); 
}

/**
 * Função auxiliar para contar peças em uma direção específica.
 */
function checkDirection(r, c, playerId, dr, dc) {
    let count = 1; // Já contamos a peça que acabou de ser colocada

    // 1. Verifica na direção positiva (ex: para baixo-direita)
    for (let i = 1; i < 4; i++) {
        const nextR = r + dr * i;
        const nextC = c + dc * i;

        if (nextR >= 0 && nextR < ROWS && nextC >= 0 && nextC < COLS && board[nextR][nextC] === playerId) {
            count++;
        } else {
            break;
        }
    }

    // 2. Verifica na direção oposta (ex: para cima-esquerda)
    const oppDr = -dr;
    const oppDc = -dc;
    
    for (let i = 1; i < 4; i++) {
        const nextR = r + oppDr * i;
        const nextC = c + oppDc * i;

        if (nextR >= 0 && nextR < ROWS && nextC >= 0 && nextC < COLS && board[nextR][nextC] === playerId) {
            count++;
        } else {
            break;
        }
    }

    return count >= 4;
}

/**
 * Verifica se a peça recém-colocada em (r, c) formou 4 em linha.
 */
function checkWin(r, c, playerId) {
    // 1. Horizontal: dr=0, dc=1 (e oposto dc=-1)
    if (checkDirection(r, c, playerId, 0, 1)) return true;
    
    // 2. Vertical: dr=1, dc=0 (só precisa olhar para baixo)
    if (checkDirection(r, c, playerId, 1, 0)) return true;

    // 3. Diagonal Principal (/)
    if (checkDirection(r, c, playerId, 1, -1)) return true;
    
    // 4. Diagonal Secundária (\)
    if (checkDirection(r, c, playerId, 1, 1)) return true;
    
    return false;
}

// --- FUNÇÕES DE UTILIDADE ---

// Função para encontrar a linha de queda em uma coluna
function findDropRow(col) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === 0) {
            return r; // Retorna o índice da linha vazia mais baixa
        }
    }
    return -1; // Coluna cheia
}

// Função para enviar uma mensagem para todos os jogadores
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// --- LÓGICA DO WEBSOCKET ---

wss.on('connection', function connection(ws) {
    if (players.length < 2) {
        const playerId = players.length + 1;
        const color = playerId === 1 ? 'vermelho' : 'amarelo';
        
        ws.playerId = playerId;
        ws.color = color;
        players.push(ws);
        
        console.log(`Jogador ${playerId} (${color}) conectado.`);
        ws.send(JSON.stringify({ acao: 'conectado', seuId: playerId, suaCor: color }));

        if (players.length === 2) {
            gameActive = true;
            currentPlayerId = 1; // Jogador 1 sempre começa
            console.log('Partida iniciada.');
            broadcast({ acao: 'iniciar_partida', turno: currentPlayerId });
        }
    } else {
        ws.close(1000, 'Sala cheia.');
        return;
    }

    ws.on('message', function incoming(message) {
        // Ignora jogadas se o jogo não estiver ativo ou não for a vez do jogador
        if (!gameActive || ws.playerId !== currentPlayerId) return; 

        const data = JSON.parse(message);
        
        if (data.acao === 'jogada') {
            const col = data.coluna;
            const row = findDropRow(col);

            if (row !== -1) { // Jogada válida
                board[row][col] = ws.playerId; // Atualiza o tabuleiro

                // 1. Envia a jogada para o frontend (fazendo a peça cair)
                broadcast({ 
                    acao: 'nova_peca', 
                    coluna: col, 
                    linha: row, // Linha de destino (0 a 5)
                    cor: ws.color 
                });
                
                // 2. Lógica de Fim de Jogo: Vitória ou Empate
                if (checkWin(row, col, ws.playerId)) {
                    gameActive = false;
                    broadcast({ 
                        acao: 'fim_de_jogo', 
                        vencedor: ws.playerId, 
                        corVencedora: ws.color,
                        mensagem: `O jogador ${ws.playerId} (${ws.color}) venceu!`
                    });
                } else if (checkDraw()) {
                     gameActive = false;
                     broadcast({ 
                        acao: 'fim_de_jogo', 
                        vencedor: 0, // 0 para empate
                        mensagem: 'O jogo terminou em empate!'
                    });
                } else {
                    // 3. Passa o turno
                    currentPlayerId = currentPlayerId === 1 ? 2 : 1;
                    broadcast({ acao: 'mudar_turno', turno: currentPlayerId });
                }

            } else {
                ws.send(JSON.stringify({ acao: 'erro', mensagem: 'Coluna cheia ou jogada inválida.' }));
            }
        }
    });

    ws.on('close', () => {
        console.log(`Jogador ${ws.playerId} desconectado.`);
        // Reseta o jogo se um jogador sair
        players = players.filter(p => p !== ws);
        gameActive = false;
        board = Array(6).fill(null).map(() => Array(7).fill(0));
        broadcast({ acao: 'reset', mensagem: 'Um jogador desconectou. Jogo resetado. Recarregue a página.' });
    });
});

server.listen(PORT, () => {
    console.log(`Acesse o jogo em http://localhost:${PORT}`);
});