# Módulo de Conciliação e Antifraude de Combustível (Biga Fleet Manager)

## 1. Visão Geral
O Módulo de Conciliação e Antifraude de Combustível é responsável por cruzar dados financeiros de abastecimento (provenientes de operadoras de cartões de combustível via TXT, SOAP, REST, gRPC ou modelo padronizado de ingestão) com a telemetria operacional em tempo real (GPS, odômetro, horímetro, geolocalização e identificação do motorista). 

O objetivo principal é mitigar fraudes e desvios operacionais de forma inteligente, reduzindo drasticamente os **falsos positivos** comuns em sistemas legados.

---

## 2. Vetores de Fraude Identificados & Mitigação

### 2.1. Uso de Cartão em Veículo Não Autorizado ou Terceiros
* **O Problema:** O cartão de combustível da placa X é passado em um posto, mas o veículo estava a quilômetros de distância ou em outra rota.
* **A Solução (Geolocalização Cruzada):** O motor de validação cruza o carimbo de data/hora (`timestamp`) e a coordenada GPS da transação do cartão com a última posição conhecida do veículo. 
* **Prevenção ao Falso Positivo (Fator Atraso/Sombra):** O sistema considera a latência de rede da operadora e eventuais lacunas de sinal de GPS (ex: túneis, áreas de sombra ou atraso de transmissão telemática), garantindo que um atraso legítimo de envio de pacote não resulte na punição indevida do motorista.

### 2.2. Incompatibilidade de Capacidade de Tanque e Litragem
* **O Problemática:** O cupom fiscal registra um volume de litros abastecidos superior à capacidade máxima física do tanque do modelo do veículo cadastrado.
* **A Solução:** Validação cruzada automática entre o cadastro de especificações do veículo (`tank_capacity_liters`) e o payload da transação financeira.

### 2.3. Fraude de Odômetro e Desvio de Consumo (Km/L)
* **O Problema:** Informação de quilometragem adulterada no momento do abastecimento para encobrir desvios de rota ou uso particular.
* **A Solução:** O sistema compara o odômetro reportado no cupom/transação com o odômetro absoluto calculado via telemetria GPS (`odometer_delta`), disparando alertas de anomalia caso o desvio ultrapasse a tolerância estatística da frota.

---

## 3. Integração com Contexto Operacional (Oficinas e Motoristas)

### 3.1. Associação Estrita com o Condutor
* Toda transação de combustível é rigidamente correlacionada ao motorista autenticado no momento (via App, iButton ou RFID), permitindo a construção do *Driver Score* comportamental e a responsabilização direta em auditorias.

### 3.2. Contexto de Manutenção (Oficinas Mecânicas)
* O motor de regras verifica se o veículo possuía uma Ordem de Serviço ativa ou se encontrava-se em uma geocerca de oficina parceira cadastrada, justificando desvios de rota ou paradas atípicas no momento do abastecimento.

---

## 4. Arquitetura de Ingestão de Dados Heterogêneos
Para suportar o legado e a modernidade de diferentes frotas e operadoras, a camada de ingestão utiliza adaptadores poliglotas:
* **Legacy Gateways:** Processadores de arquivos delimitados (TXT) e clientes SOAP para operadoras tradicionais.
* **Modern Gateways:** Endpoints REST assíncronos e conectores gRPC de alta performance.
* **Canonical Mapper:** Converte qualquer payload de entrada em um modelo de dados padronizado interno antes de submetê-lo ao motor de antifraude baseado em regras.