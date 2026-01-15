-- Script para adicionar tabela PARECERES ao banco de dados existente
-- Execute este script se você já tem um banco de dados criado
-- Este script NÃO apaga dados existentes, apenas adiciona a nova tabela

-- Verificar se a tabela já existe antes de criar
CREATE TABLE IF NOT EXISTS `PARECERES` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `pei_adaptacao_id` INT NOT NULL,
  `professor_siape` INT(7) NOT NULL,
  `periodo` VARCHAR(50) NOT NULL COMMENT 'Período do parecer (1, 2, 3 para técnico ou 1, 2 para superior)',
  `descricao` TEXT NOT NULL COMMENT 'Parecer do professor sobre o aluno no período',
  `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`pei_adaptacao_id`) REFERENCES `PEI_ADAPTACAO`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`professor_siape`) REFERENCES `SERVIDORES`(`siape`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar se a tabela foi criada com sucesso
SELECT 'Tabela PARECERES criada com sucesso!' AS Status;
