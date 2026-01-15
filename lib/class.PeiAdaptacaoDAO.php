<?php
require_once "class.Banco.php";
require_once "models/class.PeiAdaptacao.php";

class PeiAdaptacaoDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        try {
            $sql = "
                SELECT pa.id, pa.pei_geral_id, pa.codigo_componente, pa.professor_siape, pa.ementa, pa.objetivos_especificos, pa.metodologia, pa.avaliacao, pa.parecer, pa.status, pa.comentarios_napne, pa.data_criacao, pa.data_atualizacao, pa.data_envio_napne, pa.data_resposta_napne, 
                       s.nome as docente, pg.matricula, cc.componente 
                FROM PEI_ADAPTACAO pa 
                LEFT JOIN PEI_GERAL pg ON (pa.pei_geral_id = pg.id) 
                LEFT JOIN COMPONENTES_CURRICULARES cc ON (pa.codigo_componente = cc.codigo_componente)
                LEFT JOIN SERVIDORES s ON (pa.professor_siape = s.siape)
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $stmt->setFetchMode(PDO::FETCH_CLASS, PeiAdaptacao::class);
            $peis = $stmt->fetchAll();

            return $peis ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar adaptações: " . $e->getMessage());
        }
    }

    function buscarPorId($id) {
        try {
            $sql = "SELECT pa.id, pa.pei_geral_id, pa.codigo_componente, pa.professor_siape, pa.ementa, pa.objetivos_especificos, pa.metodologia, pa.avaliacao, pa.parecer, pa.status, pa.comentarios_napne, pa.data_criacao, pa.data_atualizacao, pa.data_envio_napne, pa.data_resposta_napne, s.nome as docente 
                    FROM PEI_ADAPTACAO pa 
                    LEFT JOIN SERVIDORES s ON (pa.professor_siape = s.siape)
                    WHERE pa.id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, PeiAdaptacao::class);
            $pei = $stmt->fetch();

            return $pei ?: null;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar adaptação: " . $e->getMessage());
        }
    }

    function buscarPorProfessor($siape) {
        try {
            $sql = "
                SELECT pa.id, pa.pei_geral_id, pa.codigo_componente, pa.professor_siape, pa.ementa, pa.objetivos_especificos, pa.metodologia, pa.avaliacao, pa.parecer, pa.status, pa.comentarios_napne, pa.data_criacao, pa.data_atualizacao, pa.data_envio_napne, pa.data_resposta_napne, 
                       s.nome as docente, pg.matricula, cc.componente 
                FROM PEI_ADAPTACAO pa 
                LEFT JOIN PEI_GERAL pg ON (pa.pei_geral_id = pg.id) 
                LEFT JOIN COMPONENTES_CURRICULARES cc ON (pa.codigo_componente = cc.codigo_componente)
                LEFT JOIN SERVIDORES s ON (pa.professor_siape = s.siape)
                WHERE pa.professor_siape = :siape 
                ORDER BY pa.data_criacao DESC
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':siape' => $siape]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, PeiAdaptacao::class);
            $peis = $stmt->fetchAll();

            return $peis ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar adaptações: " . $e->getMessage());
        }
    }

    function buscarPendentesNapne() {
        try {
            $sql = "
                SELECT pa.id, pa.pei_geral_id, pa.codigo_componente, pa.professor_siape, pa.ementa, pa.objetivos_especificos, pa.metodologia, pa.avaliacao, pa.parecer, pa.status, pa.comentarios_napne, pa.data_criacao, pa.data_atualizacao, pa.data_envio_napne, pa.data_resposta_napne, 
                       s.nome as docente, pg.matricula, cc.componente 
                FROM PEI_ADAPTACAO pa 
                LEFT JOIN PEI_GERAL pg ON (pa.pei_geral_id = pg.id) 
                LEFT JOIN COMPONENTES_CURRICULARES cc ON (pa.codigo_componente = cc.codigo_componente)
                LEFT JOIN SERVIDORES s ON (pa.professor_siape = s.siape)
                WHERE pa.status IN ('enviado_para_napne', 'em_avaliacao')
                ORDER BY pa.data_envio_napne DESC
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $stmt->setFetchMode(PDO::FETCH_CLASS, PeiAdaptacao::class);
            $peis = $stmt->fetchAll();

            return $peis ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar adaptações: " . $e->getMessage());
        }
    }

    function inserir(PeiAdaptacao $pei) {
        try {
            $sql = "INSERT INTO PEI_ADAPTACAO(pei_geral_id, codigo_componente, professor_siape, ementa, objetivos_especificos, metodologia, avaliacao, parecer, status, comentarios_napne) VALUES (:pei_geral_id, :codigo_componente, :professor_siape, :ementa, :objetivos_especificos, :metodologia, :avaliacao, :parecer, :status, :comentarios_napne)";
            $stmt = $this->pdo->prepare($sql);
            $resultado = $stmt->execute([
                ':pei_geral_id' => $pei->getPeiGeralId(),
                ':codigo_componente' => $pei->getCodigoComponente(),
                ':professor_siape' => $pei->getProfessorSiape(),
                ':ementa' => $pei->getEmenta(),
                ':objetivos_especificos' => $pei->getObjetivosEspecificos(),
                ':metodologia' => $pei->getMetodologia(),
                ':avaliacao' => $pei->getAvaliacao(),
                ':parecer' => $pei->getParecer(),
                ':status' => $pei->getStatus() ?: 'rascunho',
                ':comentarios_napne' => $pei->getComentariosNapne()
            ]);

            if (!$resultado) {
                $errorInfo = $stmt->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao inserir adaptação', $errorInfo[1] ?? 0);
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
                throw new Exception("PEI Adaptação não encontrado!");

            $sql = "UPDATE PEI_ADAPTACAO SET pei_geral_id=:pei_geral_id, codigo_componente=:codigo_componente, ementa=:ementa, objetivos_especificos=:objetivos_especificos, metodologia=:metodologia, avaliacao=:avaliacao, parecer=:parecer, status=:status, comentarios_napne=:comentarios_napne, data_envio_napne=:data_envio_napne, data_resposta_napne=:data_resposta_napne WHERE id=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':pei_geral_id', $pei->getPeiGeralId());
            $query->bindValue(':codigo_componente', $pei->getCodigoComponente());
            $query->bindValue(':ementa', $pei->getEmenta());
            $query->bindValue(':objetivos_especificos', $pei->getObjetivosEspecificos());
            $query->bindValue(':metodologia', $pei->getMetodologia());
            $query->bindValue(':avaliacao', $pei->getAvaliacao());
            $query->bindValue(':parecer', $pei->getParecer());
            $query->bindValue(':status', $pei->getStatus());
            $query->bindValue(':comentarios_napne', $pei->getComentariosNapne());
            
            
            $dataEnvioNapne = $pei->getDataEnvioNapne();
            $dataRespostaNapne = $pei->getDataRespostaNapne();
            
            
            if ($dataEnvioNapne !== null && trim($dataEnvioNapne) === '') {
                $dataEnvioNapne = null;
            }
            if ($dataRespostaNapne !== null && trim($dataRespostaNapne) === '') {
                $dataRespostaNapne = null;
            }
            
            $query->bindValue(':data_envio_napne', $dataEnvioNapne);
            $query->bindValue(':data_resposta_napne', $dataRespostaNapne);
            $query->bindValue(':id', $id);
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao atualizar registro', $errorInfo[1] ?? 0);
            }

            $p->setPeiGeralId($pei->getPeiGeralId());
            $p->setCodigoComponente($pei->getCodigoComponente());
            $p->setEmenta($pei->getEmenta());
            $p->setObjetivosEspecificos($pei->getObjetivosEspecificos());
            $p->setMetodologia($pei->getMetodologia());
            $p->setAvaliacao($pei->getAvaliacao());
            $p->setParecer($pei->getParecer());
            $p->setStatus($pei->getStatus());
            $p->setComentariosNapne($pei->getComentariosNapne());
            $p->setDataEnvioNapne($pei->getDataEnvioNapne());
            $p->setDataRespostaNapne($pei->getDataRespostaNapne());
            return $p;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    function apagar($id) {
        try {
            $pei = $this->buscarPorId($id);
            if (!$pei) 
                throw new Exception("PEI Adaptação não encontrado!");

            $sql = "DELETE FROM PEI_ADAPTACAO WHERE id=:id";
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