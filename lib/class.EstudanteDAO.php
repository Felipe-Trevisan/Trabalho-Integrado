<?php
require_once "class.Banco.php";
require_once "models/class.Estudante.php";

class EstudanteDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        try {
            $sql = "SELECT id_aluno, cpf, nome, contato, matricula, precisa_atendimento_psicopedagogico, historico FROM ESTUDANTES";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $stmt->setFetchMode(PDO::FETCH_CLASS, Estudante::class);
            $estudantes = $stmt->fetchAll();

            return $estudantes ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar estudantes");
        }
    }

    function buscarPorId($id) {
        try {
            
            $id = intval($id);
            if ($id <= 0) {
                return null;
            }
            
            $sql = "SELECT id_aluno, cpf, nome, contato, matricula, precisa_atendimento_psicopedagogico, historico FROM ESTUDANTES WHERE id_aluno = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, Estudante::class);
            $estudante = $stmt->fetch();
            return $estudante ?: null;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar estudante: " . $e->getMessage());
        } catch (Exception $e) {
            throw $e;
        }
    }

    function inserir(Estudante $estudante) {
        try {
            $sql = "INSERT INTO ESTUDANTES(cpf, nome, contato, matricula, precisa_atendimento_psicopedagogico, historico) VALUES (:cpf, :nome, :contato, :matricula, :precisa_atendimento_psicopedagogico, :historico)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':cpf' => $estudante->getCpf(),
                ':nome' => $estudante->getNome(),
                ':contato' => $estudante->getContato(),
                ':matricula' => $estudante->getMatricula(),
                ':precisa_atendimento_psicopedagogico' => $estudante->getPrecisaAtendimentoPsicopedagogico(),
                ':historico' => $estudante->getHistorico()
            ]);

            $id = $this->pdo->lastInsertId();
            if ($id) {
                return $this->buscarPorId($id);
            }
            
            throw new Exception("Erro ao inserir estudante: não foi possível obter o ID gerado.");
        } catch (PDOException $e) {
            throw $e;
        } catch (Exception $e) {
            throw $e;
        }
    }

    function editar($id, $estudante) {
        try {
            $e = $this->buscarPorId($id);
            if (!$e) 
                throw new Exception("Estudante não encontrado!");

            $sql = "UPDATE ESTUDANTES SET cpf=:cpf, nome=:nome, contato=:contato, matricula=:matricula, precisa_atendimento_psicopedagogico=:precisa_atendimento_psicopedagogico, historico=:historico WHERE id_aluno=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':cpf', $estudante->getCpf());
            $query->bindValue(':nome', $estudante->getNome());
            $query->bindValue(':contato', $estudante->getContato());
            $query->bindValue(':matricula', $estudante->getMatricula());
            $query->bindValue(':precisa_atendimento_psicopedagogico', $estudante->getPrecisaAtendimentoPsicopedagogico());
            $query->bindValue(':historico', $estudante->getHistorico());
            $query->bindValue(':id', $id);
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao atualizar registro', $errorInfo[1] ?? 0);
            }

            $e->setCpf($estudante->getCpf());
            $e->setNome($estudante->getNome());
            $e->setContato($estudante->getContato());
            $e->setMatricula($estudante->getMatricula());
            $e->setPrecisaAtendimentoPsicopedagogico($estudante->getPrecisaAtendimentoPsicopedagogico());
            $e->setHistorico($estudante->getHistorico());
            return $e;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    function apagar($id) {
        try {
            $estudante = $this->buscarPorId($id);
            if (!$estudante) 
                throw new Exception("Estudante não encontrado!");

            $sql = "DELETE FROM ESTUDANTES WHERE id_aluno=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':id', $id);
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao apagar registro', $errorInfo[1] ?? 0);
            }    

            return $estudante;
        } catch (PDOException $e) {
            throw $e;
        }
    }
}
?>