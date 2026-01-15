<?php
require_once "class.Banco.php";
require_once "models/class.Responsavel.php";

class ResponsavelDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        $sql = "SELECT id_responsavel, nome_responsavel, cpf_responsavel, contato_responsavel, endereco_responsavel FROM RESPONSAVEIS";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

        $stmt->setFetchMode(PDO::FETCH_CLASS, Responsavel::class);
        $responsaveis = $stmt->fetchAll();

        return $responsaveis ?: [];
    }

    function buscarPorId($id) {
        $sql = "SELECT id_responsavel, nome_responsavel, cpf_responsavel, contato_responsavel, endereco_responsavel FROM RESPONSAVEIS WHERE id_responsavel = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $id]);

        $stmt->setFetchMode(PDO::FETCH_CLASS, Responsavel::class);
        $responsavel = $stmt->fetch();

        return $responsavel ?: null;
    }

    function inserir(Responsavel $responsavel) {
        $sql = "INSERT INTO RESPONSAVEIS(nome_responsavel, cpf_responsavel, contato_responsavel, endereco_responsavel) VALUES (:nome_responsavel, :cpf_responsavel, :contato_responsavel, :endereco_responsavel)";
        $stmt = $this->pdo->prepare($sql);
        $resultado = $stmt->execute([
            ':nome_responsavel' => $responsavel->getNomeResponsavel(),
            ':cpf_responsavel' => $responsavel->getCpfResponsavel(),
            ':contato_responsavel' => $responsavel->getContatoResponsavel(),
            ':endereco_responsavel' => $responsavel->getEnderecoResponsavel()
        ]);

        if ($resultado) {
            $id = $this->pdo->lastInsertId();
            return $this->buscarPorId($id);
        }
    }

    function editar($id, $responsavel) {
        $r = $this->buscarPorId($id);
        if (!$r) 
            throw new Exception("Responsável não encontrado!");

        $sql = "UPDATE RESPONSAVEIS SET nome_responsavel=:nome_responsavel, cpf_responsavel=:cpf_responsavel, contato_responsavel=:contato_responsavel, endereco_responsavel=:endereco_responsavel WHERE id_responsavel=:id";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':nome_responsavel', $responsavel->getNomeResponsavel());
        $query->bindValue(':cpf_responsavel', $responsavel->getCpfResponsavel());
        $query->bindValue(':contato_responsavel', $responsavel->getContatoResponsavel());
        $query->bindValue(':endereco_responsavel', $responsavel->getEnderecoResponsavel());
        $query->bindValue(':id', $id);
        if (!$query->execute())
            throw new Exception("Erro ao atualizar registro.");

        $r->setNomeResponsavel($responsavel->getNomeResponsavel());
        $r->setCpfResponsavel($responsavel->getCpfResponsavel());
        $r->setContatoResponsavel($responsavel->getContatoResponsavel());
        $r->setEnderecoResponsavel($responsavel->getEnderecoResponsavel());
        return $r;
    }

    function apagar($id) {
        $responsavel = $this->buscarPorId($id);
        if (!$responsavel) 
            throw new Exception("Responsável não encontrado!");

        $sql = "DELETE FROM RESPONSAVEIS WHERE id_responsavel=:id";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':id', $id);
        if (!$query->execute())
            throw new Exception("Erro ao apagar registro!");    

        return $responsavel;
    }
}
?>