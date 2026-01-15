<?php
require_once "class.Banco.php";
require_once "models/class.Comentario.php";

class ComentarioDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        $sql = "
            SELECT c.id, c.parecer_id, c.usuario_id, c.data, c.comentarios, p.descricao as parecer_descricao, u.username 
            FROM COMENTARIOS c 
            INNER JOIN PARECERES p ON (c.parecer_id = p.id) 
            INNER JOIN USUARIOS u ON (c.usuario_id = u.siape)
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

        $stmt->setFetchMode(PDO::FETCH_CLASS, Comentario::class);
        $comentarios = $stmt->fetchAll();

        return $comentarios ?: [];
    }

    function buscarPorId($id) {
        $sql = "SELECT id, parecer_id, usuario_id, data, comentarios FROM COMENTARIOS WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $id]);

        $stmt->setFetchMode(PDO::FETCH_CLASS, Comentario::class);
        $comentario = $stmt->fetch();

        return $comentario ?: null;
    }

    function inserir(Comentario $comentario) {
        $sql = "INSERT INTO COMENTARIOS(parecer_id, usuario_id, comentarios) VALUES (:parecer_id, :usuario_id, :comentarios)";
        $stmt = $this->pdo->prepare($sql);
        $resultado = $stmt->execute([
            ':parecer_id' => $comentario->getParecerId(),
            ':usuario_id' => $comentario->getUsuarioId(),
            ':comentarios' => $comentario->getComentarios()
        ]);

        if ($resultado) {
            $id = $this->pdo->lastInsertId();
            return $this->buscarPorId($id);
        }
    }

    function editar($id, $comentario) {
        $c = $this->buscarPorId($id);
        if (!$c) 
            throw new Exception("Comentário não encontrado!");

        $sql = "UPDATE COMENTARIOS SET parecer_id=:parecer_id, usuario_id=:usuario_id, comentarios=:comentarios WHERE id=:id";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':parecer_id', $comentario->getParecerId());
        $query->bindValue(':usuario_id', $comentario->getUsuarioId());
        $query->bindValue(':comentarios', $comentario->getComentarios());
        $query->bindValue(':id', $id);
        if (!$query->execute())
            throw new Exception("Erro ao atualizar registro.");

        $c->setParecerId($comentario->getParecerId());
        $c->setUsuarioId($comentario->getUsuarioId());
        $c->setComentarios($comentario->getComentarios());
        return $c;
    }

    function apagar($id) {
        $comentario = $this->buscarPorId($id);
        if (!$comentario) 
            throw new Exception("Comentário não encontrado!");

        $sql = "DELETE FROM COMENTARIOS WHERE id=:id";
        $query = $this->pdo->prepare($sql);
        $query->bindValue(':id', $id);
        if (!$query->execute())
            throw new Exception("Erro ao apagar registro!");    

        return $comentario;
    }
}
?>