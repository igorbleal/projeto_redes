# Liga 4 (Connect Four) – Multiplayer com WebSocket

Projeto acadêmico desenvolvido para a disciplina de **Redes de Computadores / Sistemas Distribuídos**.  
Este projeto implementa o clássico jogo **Liga 4 (Connect Four)** utilizando uma arquitetura **Cliente–Servidor** com comunicação em **tempo real via WebSocket**.

---

## Sobre o Projeto

O objetivo principal é demonstrar a sincronização de estado entre múltiplos clientes **sem uso de polling**, garantindo uma experiência de jogo fluida, responsiva e totalmente sincronizada.

O servidor controla toda a lógica, evitando trapaças e assegurando consistência entre as sessões dos jogadores.

---

## Funcionalidades

- **Multiplayer em Tempo Real**  
  Dois jogadores podem jogar simultaneamente a partir de navegadores diferentes.

- **Sincronização Instantânea**  
  Jogadas propagadas via WebSocket.

- **Lógica e Validação no Servidor**  
  Verificação completa de jogadas e detecção do vencedor.

- **Interface Animada**  
  Uso de CSS Transitions simulando a “queda” da peça no tabuleiro.

- **Gerenciamento de Salas**  
  Apenas duas conexões são permitidas; terceiros são bloqueados.

---

## Tecnologias Utilizadas

### **Backend**
- Node.js  
- Express (servidor HTTP e arquivos estáticos)  
- ws (biblioteca WebSocket)

### **Frontend**
- HTML5  
- CSS3 (Grid Layout + Transitions)  
- JavaScript (vanilla)

---

## Passo a Passo para Executar o Jogo
1. Pré-requisitos

    Ter o Node.js instalado.

2. Clonar o repositório
git clone https://github.com/igorbleal/projeto_redes.git
3. Instalar dependências
npm install
4. Iniciar o servidor
node server.js
5. Acessar a aplicação

    Abra no navegador:

    http://localhost:3000
6. Jogar com dois jogadores

    Para testar multiplayer:

    Abra uma aba normal (Jogador 1)

    Abra uma aba anônima (Jogador 2)

    Ambos acessam o mesmo endereço.

    O servidor aceitará apenas duas conexões simultâneas, bloqueando conexões extras.

