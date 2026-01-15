<?php
require_once "class.Banco.php";
require_once "models/class.RespEstudante.php";

class RespEstudanteDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        $sql = "
            SELECT re.id_responsavel, re.id_aluno, r.nome_responsavel, e.nome as estudante_nome 
            FROM RESP_ESTUDANTE re 
            INNER JOIN RESPONSAVEIS r ON (re.id_responsavel = r.id_responsavel) 
            INNER JOIN ESTUDANTES e ON (re.id_aluno = e.id_aluno)
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

        $stmt->setFetchMode(PDO::FETCH_CLASS, RespEstudante::class);
        $relacoes = $stmt->fetchAll();

        return $relacoes ?: [];
    }

    function buscarPorId($ids) { 
        $sql = "SELECT id_responsavel, id_aluno FROM RESP_ESTUDANTE WHERE id_responsavel = :id_responsavel AND id_aluno = :id_aluno";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($ids);

        $stmt->setFetchMode(PDO::FETCH_CLASS, RespEstudante::class);
        $relacao = $stmt->fetch();

        return $relacao ?: null;
    }

    function inserir(RespEstudante $relacao) {
        $sql = "INSERT INTO RESP_ESTUDANTE(id_responsavel, id_aluno) VALUES (:id_responsavel, :id_aluno)";
        $stmt = $this->pdo->prepare($sql);
        $resultado = $stmt->execute([
            ':id_responsavel' => $relacao->getIdResponsavel(),
            ':id_aluno' => $relacao->getIdAluno()
        ]);

        if ($resultado) {
            $ids = ['id_responsavel' => $relacao->getIdResponsavel(), 'id_aluno' => $relacao->getIdAluno()];
            return $this->buscarPorId($ids);
        }
    }

    function editar($ids, $relacao) { 
        $r = $this->buscarPorId($ids);
        if (!$r) 
            throw new Exception("Relação Responsável-Estudante não encontrada!");

        $sql = "UPDATE RESP_ESTUDANTE SET id_responsavel=:id_responsavel, id_aluno=:id_aluno WHERE id_responsavel=:old_id_responsavel AND id_aluno=:old_id_aluno";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':id_responsavel', $relacao->getIdResponsavel());
        $query->bindValue(':id_aluno', $relacao->getIdAluno());
        $query->bindValue(':old_id_responsavel', $ids['id_responsavel']);
        $query->bindValue(':old_id_aluno', $ids['id_aluno']);
        if (!$query->execute())
            throw new Exception("Erro ao atualizar registro.");

        $r->setIdResponsavel($relacao->getIdResponsavel());
        $r->setIdAluno($relacao->getIdAluno());
        return $r;
    }

    function apagar($ids) { 
        $relacao = $this->buscarPorId($ids);
        if (!$relacao) 
            throw new Exception("Relação Responsável-Estudante não encontrada!");

        $sql = "DELETE FROM RESP_ESTUDANTE WHERE id_responsavel=:id_responsavel AND id_aluno=:id_aluno";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':id_responsavel', $ids['id_responsavel']);
        $query->bindValue(':id_aluno', $ids['id_aluno']);
        if (!$query->execute())
            throw new Exception("Erro ao apagar registro!");    

        return $relacao;
    }
}
?>