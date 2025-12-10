// APLICAÇÃO DA CORREÇÃO: Conexão direta e explícita com o servidor local.
// A porta 3000 DEVE coincidir com a porta no seu server.js.
const ws = new WebSocket('ws://localhost:3000'); 

let myPlayerId = null; // ID do jogador neste navegador (1 ou 2)
let myColor = null; 
let currentTurn = null;
let boardState = []; // Armazena o estado local do tabuleiro para referência

// Dimensões definidas no CSS (80px, ajustar se mudar)
const SLOT_SIZE = 80; 

// --- Configuração WebSocket ---

ws.onopen = () => {
    document.getElementById('status').textContent = 'Conexão estabelecida. Aguardando dados do jogador.';
    console.log('Conectado ao servidor!');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.acao === 'conectado') {
        myPlayerId = data.seuId;
        myColor = data.suaCor;
        document.getElementById('status').textContent = `Você é o Jogador ${myPlayerId} (${myColor}). Aguarde o outro jogador.`;
    } 
    else if (data.acao === 'iniciar_partida') {
        currentTurn = data.turno;
        document.getElementById('status').textContent = `Partida iniciada! É a vez do Jogador ${currentTurn}.`;
    } 
    else if (data.acao === 'mudar_turno') {
        currentTurn = data.turno;
        const msg = currentTurn === myPlayerId ? 'É A SUA VEZ!' : `Vez do Jogador ${currentTurn}.`;
        document.getElementById('status').textContent = msg;
    }
    else if (data.acao === 'nova_peca') {
        // ESSENCIAL: Recebe as coordenadas do servidor (coluna e linha) e aciona a animação
        adicionarPeca(data.coluna, data.linha, data.cor);
    }
    else if (data.acao === 'fim_de_jogo') {
        document.getElementById('status').textContent = `FIM DE JOGO! Vencedor: Jogador ${data.vencedor} (${data.corVencedora})`;
        // Desativar cliques (você pode remover o event listener das colunas aqui)
    }
    else if (data.acao === 'reset') {
        document.getElementById('status').textContent = data.mensagem;
        // Lógica de limpar o tabuleiro na interface
    }
};

ws.onerror = (error) => {
    console.error('Erro no WebSocket:', error);
};

// --- Lógica de Comunicação ---

/**
 * Envia a coluna da jogada para o servidor.
 * @param {number} coluna - O índice da coluna clicada (0 a 6).
 */
function enviarJogada(coluna) {
    if (ws.readyState === WebSocket.OPEN && myPlayerId === currentTurn) {
        ws.send(JSON.stringify({ acao: 'jogada', coluna: coluna }));
    } else if (myPlayerId !== currentTurn) {
        alert('Aguarde a sua vez!');
    }
}

// --- Funções de Interface e Animação ---

/**
 * Cria e anima a peça na interface, usando a linha de destino enviada pelo servidor.
 * Inclui o PADDING_LATERAL no cálculo X para alinhar a peça.
 */
function adicionarPeca(col, row, cor) {
    // ESTE VALOR DEVE CORRESPONDER AO PADDING LATERAL DO #tabuleiro NO CSS!
    const PADDING_LATERAL = 10; 
    
    const tabuleiro = document.getElementById('tabuleiro');
    const peca = document.createElement('div');
    peca.classList.add('peca', cor);
    
    // Calcula a posição final Y (vertical)
    const finalY = row * SLOT_SIZE + 5; 
    
    // Calcula a posição final X (horizontal), ajustando-a pelo PADDING lateral
    const finalX = col * SLOT_SIZE + PADDING_LATERAL;
    
    // 1. Posição Inicial: Acima da coluna correta
    peca.style.transform = `translate(${finalX}px, -${SLOT_SIZE * 6}px)`;
    
    tabuleiro.appendChild(peca);

    // Força o navegador a aplicar o estilo inicial antes da transição (repaint)
    void peca.offsetWidth; 

    // 2. Posição Final: A mudança de `transform` aciona a animação CSS
    peca.style.transform = `translate(${finalX}px, ${finalY}px)`;
}


document.addEventListener('DOMContentLoaded', () => {
    // Adiciona o listener de clique em todas as colunas
    const colunas = document.querySelectorAll('.coluna');
    
    colunas.forEach(coluna => {
        coluna.addEventListener('click', () => {
            const colunaIndex = parseInt(coluna.getAttribute('data-col'));
            enviarJogada(colunaIndex);
        });
    });
});