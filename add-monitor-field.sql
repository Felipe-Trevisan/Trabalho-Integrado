-- Script para adicionar o campo precisa_monitor na tabela PEI_GERAL
-- Execute este script no MySQL/MariaDB sem apagar dados existentes

USE seu_banco_de_dados; -- Substitua 'seu_banco_de_dados' pelo nome do seu banco

-- Verificar se a coluna já existe antes de adicionar
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PEI_GERAL'
    AND COLUMN_NAME = 'precisa_monitor'
);

-- Adicionar coluna apenas se não existir
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE PEI_GERAL ADD COLUMN precisa_monitor TINYINT(1) DEFAULT 0 COMMENT ''Indica se o aluno precisa de monitor (0=Não, 1=Sim)'' AFTER observacoes',
    'SELECT ''Coluna precisa_monitor já existe na tabela PEI_GERAL'' AS mensagem'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar se foi adicionada com sucesso
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'PEI_GERAL'
AND COLUMN_NAME = 'precisa_monitor';



