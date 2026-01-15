<?php
require_once "class.Banco.php";
require_once "models/class.Parecer.php";

class ParecerDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        try {
            $sql = "
                SELECT p.id, p.pei_adaptacao_id, p.professor_siape, p.periodo, p.descricao, p.data_criacao, p.data_atualizacao
                FROM PARECERES p 
                INNER JOIN PEI_ADAPTACAO pa ON (p.pei_adaptacao_id = pa.id)
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $stmt->setFetchMode(PDO::FETCH_CLASS, Parecer::class);
            $pareceres = $stmt->fetchAll();

            return $pareceres ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar pareceres: " . $e->getMessage());
        }
    }
    
    function buscarPorPeiAdaptacao($pei_adaptacao_id) {
        try {
            $sql = "SELECT id, pei_adaptacao_id, professor_siape, periodo, descricao, data_criacao, data_atualizacao FROM PARECERES WHERE pei_adaptacao_id = :pei_adaptacao_id ORDER BY periodo, data_criacao DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':pei_adaptacao_id' => $pei_adaptacao_id]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, Parecer::class);
            $pareceres = $stmt->fetchAll();

            return $pareceres ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar pareceres por PEI Adaptativo: " . $e->getMessage());
        }
    }

    function buscarPorId($id) {
        try {
            $sql = "SELECT id, pei_adaptacao_id, professor_siape, periodo, descricao, data_criacao, data_atualizacao FROM PARECERES WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, Parecer::class);
            $parecer = $stmt->fetch();

            return $parecer ?: null;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar parecer: " . $e->getMessage());
        }
    }

    function inserir(Parecer $parecer) {
        try {
            $sql = "INSERT INTO PARECERES(pei_adaptacao_id, professor_siape, periodo, descricao) VALUES (:pei_adaptacao_id, :professor_siape, :periodo, :descricao)";
            $stmt = $this->pdo->prepare($sql);
            $resultado = $stmt->execute([
                ':pei_adaptacao_id' => $parecer->getPeiAdaptacaoId(),
                ':professor_siape' => $parecer->getProfessorSiape(),
                ':periodo' => $parecer->getPeriodo(),
                ':descricao' => $parecer->getDescricao()
            ]);

            if ($resultado) {
                $id = $this->pdo->lastInsertId();
                return $this->buscarPorId($id);
            }
            throw new Exception("Erro ao inserir parecer");
        } catch (PDOException $e) {
            throw new Exception("Erro ao inserir parecer: " . $e->getMessage());
        }
    }

    function editar($id, $parecer) {
        try {
            $p = $this->buscarPorId($id);
            if (!$p) 
                throw new Exception("Parecer não encontrado!");

            $sql = "UPDATE PARECERES SET pei_adaptacao_id=:pei_adaptacao_id, periodo=:periodo, descricao=:descricao WHERE id=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':pei_adaptacao_id', $parecer->getPeiAdaptacaoId());
            $query->bindValue(':periodo', $parecer->getPeriodo());
            $query->bindValue(':descricao', $parecer->getDescricao());
            $query->bindValue(':id', $id);
            if (!$query->execute())
                throw new Exception("Erro ao atualizar registro.");

            $p->setPeiAdaptacaoId($parecer->getPeiAdaptacaoId());
            $p->setPeriodo($parecer->getPeriodo());
            $p->setDescricao($parecer->getDescricao());
            return $p;
        } catch (PDOException $e) {
            throw new Exception("Erro ao editar parecer: " . $e->getMessage());
        }
    }

    function apagar($id) {
        try {
            $parecer = $this->buscarPorId($id);
            if (!$parecer) 
                throw new Exception("Parecer não encontrado!");

            $sql = "DELETE FROM PARECERES WHERE id=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':id', $id);
            if (!$query->execute())
                throw new Exception("Erro ao apagar registro!");    

            return $parecer;
        } catch (PDOException $e) {
            throw new Exception("Erro ao apagar parecer: " . $e->getMessage());
        }
    }
}
?>