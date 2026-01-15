<?php
require_once "class.Banco.php";
require_once "models/class.EstudanteNecessidade.php";

class EstudanteNecessidadeDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        $sql = "
            SELECT en.estudante_cpf, en.necessidade_id, e.nome as estudante_nome, n.nome as necessidade_nome 
            FROM ESTUDANTES_NECESSIDADES en 
            INNER JOIN ESTUDANTES e ON (en.estudante_cpf = e.cpf) 
            INNER JOIN NECESSIDADES_ESPECIFICAS n ON (en.necessidade_id = n.necessidade_id)
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

        $stmt->setFetchMode(PDO::FETCH_CLASS, EstudanteNecessidade::class);
        $relacoes = $stmt->fetchAll();

        return $relacoes ?: [];
    }

    function buscarPorId($ids) { 
        $sql = "SELECT estudante_cpf, necessidade_id FROM ESTUDANTES_NECESSIDADES WHERE estudante_cpf = :estudante_cpf AND necessidade_id = :necessidade_id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($ids);

        $stmt->setFetchMode(PDO::FETCH_CLASS, EstudanteNecessidade::class);
        $relacao = $stmt->fetch();

        return $relacao ?: null;
    }

    function buscarPorCpf($cpf) {
        $sql = "SELECT estudante_cpf, necessidade_id FROM ESTUDANTES_NECESSIDADES WHERE estudante_cpf = :estudante_cpf";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':estudante_cpf' => $cpf]);

        $stmt->setFetchMode(PDO::FETCH_CLASS, EstudanteNecessidade::class);
        $relacoes = $stmt->fetchAll();

        return $relacoes ?: [];
    }

    function inserir(EstudanteNecessidade $relacao) {
        $sql = "INSERT INTO ESTUDANTES_NECESSIDADES(estudante_cpf, necessidade_id) VALUES (:estudante_cpf, :necessidade_id)";
        $stmt = $this->pdo->prepare($sql);
        $resultado = $stmt->execute([
            ':estudante_cpf' => $relacao->getEstudanteCpf(),
            ':necessidade_id' => $relacao->getNecessidadeId()
        ]);

        if ($resultado) {
            $ids = ['estudante_cpf' => $relacao->getEstudanteCpf(), 'necessidade_id' => $relacao->getNecessidadeId()];
            return $this->buscarPorId($ids);
        }
    }

    function editar($ids, $relacao) { 
        $r = $this->buscarPorId($ids);
        if (!$r) 
            throw new Exception("Relação Estudante-Necessidade não encontrada!");

        $sql = "UPDATE ESTUDANTES_NECESSIDADES SET estudante_cpf=:estudante_cpf, necessidade_id=:necessidade_id WHERE estudante_cpf=:old_estudante_cpf AND necessidade_id=:old_necessidade_id";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':estudante_cpf', $relacao->getEstudanteCpf());
        $query->bindValue(':necessidade_id', $relacao->getNecessidadeId());
        $query->bindValue(':old_estudante_cpf', $ids['estudante_cpf']);
        $query->bindValue(':old_necessidade_id', $ids['necessidade_id']);
        if (!$query->execute())
            throw new Exception("Erro ao atualizar registro.");

        $r->setEstudanteCpf($relacao->getEstudanteCpf());
        $r->setNecessidadeId($relacao->getNecessidadeId());
        return $r;
    }

    function apagar($ids) { 
        $relacao = $this->buscarPorId($ids);
        if (!$relacao) 
            throw new Exception("Relação Estudante-Necessidade não encontrada!");

        $sql = "DELETE FROM ESTUDANTES_NECESSIDADES WHERE estudante_cpf=:estudante_cpf AND necessidade_id=:necessidade_id";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':estudante_cpf', $ids['estudante_cpf']);
        $query->bindValue(':necessidade_id', $ids['necessidade_id']);
        if (!$query->execute())
            throw new Exception("Erro ao apagar registro!");    

        return $relacao;
    }
}
?>