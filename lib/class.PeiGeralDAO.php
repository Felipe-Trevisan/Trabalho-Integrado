<?php
require_once "class.Banco.php";
require_once "models/class.PeiGeral.php";

class PeiGeralDAO {
    private $pdo;

    function __construct() { 
        $this->pdo = Banco::getConexao(); 
        $this->ensureSchema();
    }

    private function ensureSchema() {
        try {
            
            $stmt = $this->pdo->query("SHOW COLUMNS FROM PEI_GERAL LIKE 'codigo_componente'");
            $columnExists = $stmt && $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$columnExists) {
                $this->pdo->exec("ALTER TABLE PEI_GERAL ADD COLUMN codigo_componente INT NULL AFTER periodo");
                
                try {
                    $this->pdo->exec("ALTER TABLE PEI_GERAL ADD CONSTRAINT fk_pei_geral_componente FOREIGN KEY (codigo_componente) REFERENCES COMPONENTES_CURRICULARES(codigo_componente)");
                } catch (PDOException $fkException) {
                }
            }
            
            
            $stmt = $this->pdo->query("SHOW COLUMNS FROM PEI_GERAL LIKE 'precisa_monitor'");
            $columnExists = $stmt && $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$columnExists) {
                $this->pdo->exec("ALTER TABLE PEI_GERAL ADD COLUMN precisa_monitor TINYINT(1) DEFAULT 0 COMMENT 'Indica se o aluno precisa de monitor (0=Não, 1=Sim)' AFTER observacoes");
            }
        } catch (PDOException $e) {
        }
    }

    function buscarTodos() {
        try {
            $sql = "
                SELECT pg.id, pg.id_aluno, pg.matricula, pg.professor_siape, pg.periodo, pg.codigo_componente, pg.necessidade_especifica, pg.objetivo_geral, pg.conteudos, pg.parecer, pg.dificuldades, pg.interesses_habilidades, pg.estrategias, pg.observacoes, pg.precisa_monitor, pg.data_criacao, pg.data_atualizacao
                FROM PEI_GERAL pg
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $stmt->setFetchMode(PDO::FETCH_CLASS, PeiGeral::class);
            $peis = $stmt->fetchAll();

            return $peis ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar PEIs: " . $e->getMessage());
        }
    }

    function buscarPorId($id) {
        try {
            $sql = "SELECT id, id_aluno, matricula, professor_siape, periodo, codigo_componente, necessidade_especifica, objetivo_geral, conteudos, parecer, dificuldades, interesses_habilidades, estrategias, observacoes, precisa_monitor, data_criacao, data_atualizacao FROM PEI_GERAL WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, PeiGeral::class);
            $pei = $stmt->fetch();

            return $pei ?: null;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar PEI: " . $e->getMessage());
        }
    }

    function buscarPorProfessor($siape) {
        try {
            $sql = "SELECT id, id_aluno, matricula, professor_siape, periodo, codigo_componente, necessidade_especifica, objetivo_geral, conteudos, parecer, dificuldades, interesses_habilidades, estrategias, observacoes, precisa_monitor, data_criacao, data_atualizacao FROM PEI_GERAL WHERE professor_siape = :siape ORDER BY data_criacao DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':siape' => $siape]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, PeiGeral::class);
            $peis = $stmt->fetchAll();

            return $peis ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar PEIs: " . $e->getMessage());
        }
    }

    function inserir(PeiGeral $pei) {
        try {
            $sql = "INSERT INTO PEI_GERAL(id_aluno, matricula, professor_siape, periodo, codigo_componente, necessidade_especifica, objetivo_geral, conteudos, parecer, dificuldades, interesses_habilidades, estrategias, observacoes, precisa_monitor) VALUES (:id_aluno, :matricula, :professor_siape, :periodo, :codigo_componente, :necessidade_especifica, :objetivo_geral, :conteudos, :parecer, :dificuldades, :interesses_habilidades, :estrategias, :observacoes, :precisa_monitor)";
            $stmt = $this->pdo->prepare($sql);
            $resultado = $stmt->execute([
                ':id_aluno' => $pei->getIdAluno(),
                ':matricula' => $pei->getMatricula(),
                ':professor_siape' => $pei->getProfessorSiape(),
                ':periodo' => $pei->getPeriodo(),
                ':codigo_componente' => $pei->getCodigoComponente(),
                ':necessidade_especifica' => $pei->getNecessidadeEspecifica(),
                ':objetivo_geral' => $pei->getObjetivoGeral(),
                ':conteudos' => $pei->getConteudos(),
                ':parecer' => $pei->getParecer(),
                ':dificuldades' => $pei->getDificuldades(),
                ':interesses_habilidades' => $pei->getInteressesHabilidades(),
                ':estrategias' => $pei->getEstrategias(),
                ':observacoes' => $pei->getObservacoes(),
                ':precisa_monitor' => $pei->getPrecisaMonitor() ? 1 : 0
            ]);

            if (!$resultado) {
                $errorInfo = $stmt->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao inserir PEI', $errorInfo[1] ?? 0);
            }

            $id = $this->pdo->lastInsertId();
            return $this->buscarPorId($id);
        } catch (PDOException $e) {
            throw $e;
        }
    }

    function editar($id, $pei) {
        try {
            $p = $this->buscarPorId($id);
            if (!$p) 
                throw new Exception("PEI Geral não encontrado!");

            $sql = "UPDATE PEI_GERAL SET id_aluno=:id_aluno, matricula=:matricula, periodo=:periodo, codigo_componente=:codigo_componente, necessidade_especifica=:necessidade_especifica, objetivo_geral=:objetivo_geral, conteudos=:conteudos, parecer=:parecer, dificuldades=:dificuldades, interesses_habilidades=:interesses_habilidades, estrategias=:estrategias, observacoes=:observacoes, precisa_monitor=:precisa_monitor WHERE id=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':id_aluno', $pei->getIdAluno());
            $query->bindValue(':matricula', $pei->getMatricula());
            $query->bindValue(':periodo', $pei->getPeriodo());
            $query->bindValue(':codigo_componente', $pei->getCodigoComponente());
            $query->bindValue(':necessidade_especifica', $pei->getNecessidadeEspecifica());
            $query->bindValue(':objetivo_geral', $pei->getObjetivoGeral());
            $query->bindValue(':conteudos', $pei->getConteudos());
            $query->bindValue(':parecer', $pei->getParecer());
            $query->bindValue(':dificuldades', $pei->getDificuldades());
            $query->bindValue(':interesses_habilidades', $pei->getInteressesHabilidades());
            $query->bindValue(':estrategias', $pei->getEstrategias());
            $query->bindValue(':observacoes', $pei->getObservacoes());
            $query->bindValue(':precisa_monitor', $pei->getPrecisaMonitor() ? 1 : 0);
            $query->bindValue(':id', $id);
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao atualizar registro', $errorInfo[1] ?? 0);
            }

            $p->setIdAluno($pei->getIdAluno());
            $p->setMatricula($pei->getMatricula());
            $p->setPeriodo($pei->getPeriodo());
            $p->setCodigoComponente($pei->getCodigoComponente());
            $p->setNecessidadeEspecifica($pei->getNecessidadeEspecifica());
            $p->setObjetivoGeral($pei->getObjetivoGeral());
            $p->setConteudos($pei->getConteudos());
            $p->setParecer($pei->getParecer());
            $p->setDificuldades($pei->getDificuldades());
            $p->setInteressesHabilidades($pei->getInteressesHabilidades());
            $p->setEstrategias($pei->getEstrategias());
            $p->setObservacoes($pei->getObservacoes());
            return $p;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    function apagar($id) {
        try {
            $pei = $this->buscarPorId($id);
            if (!$pei) 
                throw new Exception("PEI Geral não encontrado!");

            $sql = "DELETE FROM PEI_GERAL WHERE id=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':id', $id);
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao apagar registro', $errorInfo[1] ?? 0);
            }    

            return $pei;
        } catch (PDOException $e) {
            throw $e;
        }
    }
}
?>