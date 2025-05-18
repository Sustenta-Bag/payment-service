// Uma função simples para renderizar o HTML da página de simulação de pagamento
function renderPaymentSimulationPage(payment) {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simulação de Pagamento</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f7f9fc;
        color: #333;
      }
      .container {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 30px;
      }
      h1 {
        color: #2c3e50;
        margin-top: 0;
        border-bottom: 2px solid #f1f1f1;
        padding-bottom: 10px;
      }
      .order-info {
        background-color: #f8f9fa;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 20px;
      }
      .item {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #eee;
        padding: 10px 0;
      }
      .item:last-child {
        border-bottom: none;
      }
      .amount {
        font-weight: bold;
        font-size: 1.2em;
        margin: 20px 0;
        text-align: right;
      }
      .btn-group {
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
      }
      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s;
        text-transform: uppercase;
        letter-spacing: 1px;
        width: 32%;
      }
      .btn-success {
        background-color: #27ae60;
        color: white;
      }
      .btn-success:hover {
        background-color: #219653;
      }
      .btn-warning {
        background-color: #f39c12;
        color: white;
      }
      .btn-warning:hover {
        background-color: #d68910;
      }
      .btn-danger {
        background-color: #e74c3c;
        color: white;
      }
      .btn-danger:hover {
        background-color: #c0392b;
      }
      .status-indicator {
        display: none;
        margin-top: 20px;
        padding: 15px;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
      }
      .result-message {
        margin-top: 20px;
        padding: 15px;
        border-radius: 4px;
        text-align: center;
        display: none;
      }
      .result-success {
        background-color: #d4edda;
        color: #155724;
      }
      .result-pending {
        background-color: #fff3cd;
        color: #856404;
      }
      .result-error {
        background-color: #f8d7da;
        color: #721c24;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Simulação de Pagamento</h1>
      
      <div class="order-info">
        <h3>Informações do Pedido</h3>
        <p><strong>Pedido #:</strong> ${payment.orderId}</p>
        <p><strong>Usuário:</strong> ${payment.userId}</p>
      </div>
      
      <h3>Itens</h3>
      ${payment.items.map(item => `
        <div class="item">
          <div>
            <p><strong>${item.title}</strong> x${item.quantity}</p>
            <p class="item-desc">${item.description || 'Sem descrição'}</p>
          </div>
          <div>
            <p>R$ ${(item.unitPrice * item.quantity).toFixed(2)}</p>
          </div>
        </div>
      `).join('')}
      
      <div class="amount">
        Total: R$ ${payment.amount.toFixed(2)}
      </div>
      
      <div class="status-indicator" id="statusIndicator"></div>
        <div class="result-message" id="resultMessage"></div>
      
      <div class="btn-group">
        <button class="btn btn-success" id="approveBtn" data-action="approve">Aprovar</button>
        <button class="btn btn-warning" id="pendingBtn" data-action="pending">Pendente</button>
        <button class="btn btn-danger" id="rejectBtn" data-action="reject">Rejeitar</button>
      </div>
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Adicionar event listeners para os botões
        document.getElementById('approveBtn').addEventListener('click', function() {
          simulatePayment('approve');
        });
        
        document.getElementById('pendingBtn').addEventListener('click', function() {
          simulatePayment('pending');
        });
        
        document.getElementById('rejectBtn').addEventListener('click', function() {
          simulatePayment('reject');
        });
      });
      function simulatePayment(action) {
        // Mostrar indicador de status
        const statusIndicator = document.getElementById('statusIndicator');
        statusIndicator.style.display = 'block';
        statusIndicator.innerText = 'Processando pagamento...';
        statusIndicator.style.backgroundColor = '#e2e3e5';
        statusIndicator.style.color = '#383d41';
        
        // Desabilitar botões durante o processamento
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => btn.disabled = true);
        
        // Enviar solicitação para processar o pagamento
        fetch('/api/payment-simulation/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: '${payment.orderId}',
            action: action
          })
        })
        .then(response => response.json())
        .then(data => {
          statusIndicator.style.display = 'none';
          
          const resultMessage = document.getElementById('resultMessage');
          resultMessage.style.display = 'block';
          
          if (data.success) {
            let statusClass = '';
            let statusText = '';
            
            switch (data.data.status) {
              case 'approved':
                statusClass = 'result-success';
                statusText = 'Pagamento aprovado com sucesso!';
                break;
              case 'pending':
                statusClass = 'result-pending';
                statusText = 'Pagamento em processamento. Status: Pendente';
                break;
              case 'rejected':
                statusClass = 'result-error';
                statusText = 'Pagamento rejeitado.';
                break;
              default:
                statusClass = 'result-pending';
                statusText = 'Status do pagamento: ' + data.data.status;
            }
            
            resultMessage.className = 'result-message ' + statusClass;
            resultMessage.innerText = statusText;
          } else {
            resultMessage.className = 'result-message result-error';
            resultMessage.innerText = 'Erro: ' + data.message;
          }
          
          // Habilitar botões após o processamento
          buttons.forEach(btn => btn.disabled = false);
        })
        .catch(error => {
          statusIndicator.style.display = 'none';
          const resultMessage = document.getElementById('resultMessage');
          resultMessage.style.display = 'block';
          resultMessage.className = 'result-message result-error';
          resultMessage.innerText = 'Erro de conexão: ' + error.message;
          
          // Habilitar botões após o processamento
          buttons.forEach(btn => btn.disabled = false);
        });
      }
    </script>
  </body>
  </html>
  `;
}

module.exports = {
  renderPaymentSimulationPage
};
