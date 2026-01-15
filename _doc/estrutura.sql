DROP TABLE IF EXISTS `RESP_ESTUDANTE`;
DROP TABLE IF EXISTS `ESTUDANTES_NECESSIDADES`;
DROP TABLE IF EXISTS `PARECERES`;
DROP TABLE IF EXISTS `PEI_ADAPTACAO`;
DROP TABLE IF EXISTS `PEI_GERAL`;
DROP TABLE IF EXISTS `MATRICULAS`;
DROP TABLE IF EXISTS `CURSOS`;
DROP TABLE IF EXISTS `RESPONSAVEIS`;
DROP TABLE IF EXISTS `ESTUDANTES`;
DROP TABLE IF EXISTS `COMPONENTES_CURRICULARES`;
DROP TABLE IF EXISTS `USUARIOS`;
DROP TABLE IF EXISTS `SERVIDORES`;
DROP TABLE IF EXISTS `NECESSIDADES_ESPECIFICAS`;

CREATE TABLE `NECESSIDADES_ESPECIFICAS` (
  `necessidade_id` INT PRIMARY KEY AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `descricao` TEXT
);

CREATE TABLE `SERVIDORES` (
  `siape` INT(7) PRIMARY KEY,
  `cpf` VARCHAR(11) NOT NULL UNIQUE,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `telefone` VARCHAR(20),
  `tipo` ENUM('Docente', 'CAE', 'NAPNE') NOT NULL
);

CREATE TABLE `USUARIOS` (
  `siape` INT(7) PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `senha` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`siape`) REFERENCES `SERVIDORES`(`siape`)
);

CREATE TABLE `COMPONENTES_CURRICULARES` (
  `codigo_componente` INT PRIMARY KEY AUTO_INCREMENT,
  `componente` VARCHAR(255) NOT NULL,
  `carga_horaria` INT NOT NULL,
  `ementa` TEXT COMMENT 'Ementa do componente curricular'
);

CREATE TABLE `ESTUDANTES` (
  `id_aluno` INT PRIMARY KEY AUTO_INCREMENT,
  `cpf` VARCHAR(11) NOT NULL UNIQUE,
  `nome` VARCHAR(255) NOT NULL,
  `contato` VARCHAR(20),
  `matricula` VARCHAR(20) NOT NULL UNIQUE,
  `precisa_atendimento_psicopedagogico` BOOLEAN DEFAULT FALSE,
  `monitorado` BOOLEAN DEFAULT FALSE,
  `historico` TEXT 
);

CREATE TABLE `RESPONSAVEIS` (
  `id_responsavel` INT PRIMARY KEY AUTO_INCREMENT,
  `nome_responsavel` VARCHAR(255) NOT NULL,
  `cpf_responsavel` VARCHAR(11) NOT NULL UNIQUE,
  `contato_responsavel` VARCHAR(20),
  `endereco_responsavel` VARCHAR(255)
);

CREATE TABLE `CURSOS` (
  `codigo` VARCHAR(50) PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `modalidade` VARCHAR(100),
  `carga_horaria` INT,
  `duracao` VARCHAR(50),
  `coordenador_cpf` VARCHAR(11),
  FOREIGN KEY (`coordenador_cpf`) REFERENCES `SERVIDORES`(`cpf`)
);

CREATE TABLE `MATRICULAS` (
  `matricula` VARCHAR(20) PRIMARY KEY,
  `estudante_id` INT NOT NULL,
  `curso_id` VARCHAR(50) NOT NULL,
  `ativo` BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (`estudante_id`) REFERENCES `ESTUDANTES`(`id_aluno`),
  FOREIGN KEY (`curso_id`) REFERENCES `CURSOS`(`codigo`)
);

CREATE TABLE `PEI_GERAL` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `id_aluno` INT NOT NULL,
  `matricula` VARCHAR(20) NOT NULL,
  `professor_siape` INT(7) NOT NULL,
  `periodo` CHAR(6) NOT NULL,
  `codigo_componente` INT NULL,
  `necessidade_especifica` TEXT,
  `objetivo_geral` TEXT NOT NULL COMMENT 'Objetivo geral do PEI criado pelo NAPNE',
  `conteudos` TEXT NOT NULL COMMENT 'Conteúdos do PEI criado pelo NAPNE',
  `parecer` TEXT NOT NULL COMMENT 'Parecer do NAPNE sobre o aluno',
  `dificuldades` TEXT,
  `interesses_habilidades` TEXT,
  `estrategias` TEXT,
  `observacoes` TEXT,
  `precisa_monitor` TINYINT(1) DEFAULT 0 COMMENT 'Indica se o aluno precisa de monitor (0=Não, 1=Sim)',
  `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_aluno`) REFERENCES `ESTUDANTES`(`id_aluno`),
  FOREIGN KEY (`matricula`) REFERENCES `MATRICULAS`(`matricula`),
  FOREIGN KEY (`professor_siape`) REFERENCES `SERVIDORES`(`siape`),
  FOREIGN KEY (`codigo_componente`) REFERENCES `COMPONENTES_CURRICULARES`(`codigo_componente`)
);

CREATE TABLE `PEI_ADAPTACAO` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `pei_geral_id` INT NOT NULL,
  `codigo_componente` INT NOT NULL,
  `professor_siape` INT(7) NOT NULL,
  `ementa` TEXT COMMENT 'Ementa do componente curricular',
  `objetivos_especificos` TEXT NOT NULL COMMENT 'Objetivos específicos da adaptação criada pelo professor',
  `metodologia` TEXT NOT NULL COMMENT 'Metodologia que o professor vai usar',
  `avaliacao` TEXT NOT NULL COMMENT 'Avaliação proposta pelo professor',
  `parecer` TEXT NOT NULL COMMENT 'Parecer do professor sobre a adaptação',
  `status` ENUM('rascunho', 'enviado_para_napne', 'em_avaliacao', 'aprovado', 'rejeitado') DEFAULT 'rascunho',
  `comentarios_napne` TEXT COMMENT 'Comentários do NAPNE sobre a adaptação',
  `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `data_envio_napne` TIMESTAMP NULL,
  `data_resposta_napne` TIMESTAMP NULL,
  FOREIGN KEY (`pei_geral_id`) REFERENCES `PEI_GERAL`(`id`),
  FOREIGN KEY (`codigo_componente`) REFERENCES `COMPONENTES_CURRICULARES`(`codigo_componente`),
  FOREIGN KEY (`professor_siape`) REFERENCES `SERVIDORES`(`siape`)
);

CREATE TABLE `PARECERES` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `pei_adaptacao_id` INT NOT NULL,
  `professor_siape` INT(7) NOT NULL,
  `periodo` VARCHAR(50) NOT NULL COMMENT 'Trimestre ou semestre (ex: 1º Trimestre, 1º Semestre)',
  `descricao` TEXT NOT NULL COMMENT 'Parecer do professor sobre o aluno no período',
  `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`pei_adaptacao_id`) REFERENCES `PEI_ADAPTACAO`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`professor_siape`) REFERENCES `SERVIDORES`(`siape`)
);

CREATE TABLE `ESTUDANTES_NECESSIDADES` (
  `estudante_cpf` VARCHAR(11) NOT NULL,
  `necessidade_id` INT NOT NULL,
  PRIMARY KEY (`estudante_cpf`, `necessidade_id`),
  FOREIGN KEY (`estudante_cpf`) REFERENCES `ESTUDANTES`(`cpf`),
  FOREIGN KEY (`necessidade_id`) REFERENCES `NECESSIDADES_ESPECIFICAS`(`necessidade_id`)
);

CREATE TABLE `RESP_ESTUDANTE` (
  `id_responsavel` INT NOT NULL,
  `id_aluno` INT NOT NULL,
  PRIMARY KEY (`id_responsavel`, `id_aluno`),
  FOREIGN KEY (`id_responsavel`) REFERENCES `RESPONSAVEIS`(`id_responsavel`),
  FOREIGN KEY (`id_aluno`) REFERENCES `ESTUDANTES`(`id_aluno`)
);

