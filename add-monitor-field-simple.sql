-- Versão simples: Adiciona o campo precisa_monitor na tabela PEI_GERAL
-- Execute este comando no MySQL/MariaDB

ALTER TABLE PEI_GERAL 
ADD COLUMN precisa_monitor TINYINT(1) DEFAULT 0 
COMMENT 'Indica se o aluno precisa de monitor (0=Não, 1=Sim)' 
AFTER observacoes;



