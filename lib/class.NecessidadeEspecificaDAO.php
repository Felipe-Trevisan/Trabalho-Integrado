<?php
require_once "class.Banco.php";
require_once "models/class.NecessidadeEspecifica.php";

class NecessidadeEspecificaDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        try {
            $sql = "SELECT necessidade_id, nome, descricao FROM NECESSIDADES_ESPECIFICAS";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $stmt->setFetchMode(PDO::FETCH_CLASS, NecessidadeEspecifica::class);
            $necessidades = $stmt->fetchAll();

            return $necessidades ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar necessidades: " . $e->getMessage());
        }
    }

    function buscarPorId($id) {
        $sql = "SELECT necessidade_id, nome, descricao FROM NECESSIDADES_ESPECIFICAS WHERE necessidade_id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $id]);

        $stmt->setFetchMode(PDO::FETCH_CLASS, NecessidadeEspecifica::class);
        $necessidade = $stmt->fetch();

        return $necessidade ?: null;
    }

    function inserir(NecessidadeEspecifica $necessidade) {
        $sql = "INSERT INTO NECESSIDADES_ESPECIFICAS(nome, descricao) VALUES (:nome, :descricao)";
        $stmt = $this->pdo->prepare($sql);
        $resultado = $stmt->execute([
            ':nome' => $necessidade->getNome(),
            ':descricao' => $necessidade->getDescricao()
        ]);

        if ($resultado) {
            $id = $this->pdo->lastInsertId();
            return $this->buscarPorId($id);
        }
    }

    function editar($id, $necessidade) {
        $n = $this->buscarPorId($id);
        if (!$n) 
            throw new Exception("Necessidade específica não encontrada!");

        $sql = "UPDATE NECESSIDADES_ESPECIFICAS SET nome=:nome, descricao=:descricao WHERE necessidade_id=:id";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':nome', $necessidade->getNome());
        $query->bindValue(':descricao', $necessidade->getDescricao());
        $query->bindValue(':id', $id);
        if (!$query->execute())
            throw new Exception("Erro ao atualizar registro.");

        $n->setNome($necessidade->getNome());
        $n->setDescricao($necessidade->getDescricao());
        return $n;
    }

    function apagar($id) {
        $necessidade = $this->buscarPorId($id);
        if (!$necessidade) 
            throw new Exception("Necessidade específica não encontrada!");

        $sql = "DELETE FROM NECESSIDADES_ESPECIFICAS WHERE necessidade_id=:id";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':id', $id);
        if (!$query->execute())
            throw new Exception("Erro ao apagar registro!");    

        return $necessidade;
    }
}
?>