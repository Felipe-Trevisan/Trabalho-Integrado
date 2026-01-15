<?php
require_once "class.Banco.php";
require_once "models/class.Matricula.php";

class MatriculaDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        try {
            $sql = "
                SELECT m.matricula, m.estudante_id, m.curso_id, m.ativo
                FROM MATRICULAS m
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $stmt->setFetchMode(PDO::FETCH_CLASS, Matricula::class);
            $matriculas = $stmt->fetchAll();

            return $matriculas ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar matrículas: " . $e->getMessage());
        }
    }

    function buscarPorId($id) {
        try {
            $sql = "SELECT matricula, estudante_id, curso_id, ativo FROM MATRICULAS WHERE matricula = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, Matricula::class);
            $matricula = $stmt->fetch();

            return $matricula ?: null;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar matrícula: " . $e->getMessage());
        }
    }

    function inserir(Matricula $matricula) {
        try {
            $sql = "INSERT INTO MATRICULAS(matricula, estudante_id, curso_id, ativo) VALUES (:matricula, :estudante_id, :curso_id, :ativo)";
            $stmt = $this->pdo->prepare($sql);
            $resultado = $stmt->execute([
                ':matricula' => $matricula->getMatricula(),
                ':estudante_id' => $matricula->getEstudanteId(),
                ':curso_id' => $matricula->getCursoId(),
                ':ativo' => $matricula->getAtivo()
            ]);

            if ($resultado) {
                return $this->buscarPorId($matricula->getMatricula());
            }
            
            throw new Exception("Erro ao inserir matrícula!");
        } catch (PDOException $e) {
            throw new Exception("Erro ao inserir matrícula");
        }
    }

    function editar($id, $matricula) {
        try {
            $m = $this->buscarPorId($id);
            if (!$m) 
                throw new Exception("Matrícula não encontrada!");

            $sql = "UPDATE MATRICULAS SET estudante_id=:estudante_id, curso_id=:curso_id, ativo=:ativo WHERE matricula=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':estudante_id', $matricula->getEstudanteId());
            $query->bindValue(':curso_id', $matricula->getCursoId());
            $query->bindValue(':ativo', $matricula->getAtivo());
            $query->bindValue(':id', $id);
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao atualizar registro', $errorInfo[1] ?? 0);
            }

            $m->setEstudanteId($matricula->getEstudanteId());
            $m->setCursoId($matricula->getCursoId());
            $m->setAtivo($matricula->getAtivo());
            return $m;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    function apagar($id) {
        try {
            $matricula = $this->buscarPorId($id);
            if (!$matricula) 
                throw new Exception("Matrícula não encontrada!");

            $sql = "DELETE FROM MATRICULAS WHERE matricula=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':id', $id);
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao apagar registro', $errorInfo[1] ?? 0);
            }    

            return $matricula;
        } catch (PDOException $e) {
            throw $e;
        }
    }
}
?>