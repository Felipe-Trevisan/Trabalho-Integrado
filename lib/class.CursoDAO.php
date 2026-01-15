<?php
require_once "class.Banco.php";
require_once "models/class.Curso.php";

class CursoDAO {
    private $pdo;

    function __construct() { $this->pdo = Banco::getConexao(); }

    function buscarTodos() {
        try {
            $sql = "
                SELECT c.codigo, c.nome, c.modalidade, c.carga_horaria, c.duracao, c.coordenador_cpf
                FROM CURSOS c
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $stmt->setFetchMode(PDO::FETCH_CLASS, Curso::class);
            $cursos = $stmt->fetchAll();

            return $cursos ?: [];
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar cursos: " . $e->getMessage());
        }
    }

    function buscarPorId($id) {
        try {
            $sql = "SELECT codigo, nome, modalidade, carga_horaria, duracao, coordenador_cpf FROM CURSOS WHERE codigo = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $stmt->setFetchMode(PDO::FETCH_CLASS, Curso::class);
            $curso = $stmt->fetch();

            return $curso ?: null;
        } catch (PDOException $e) {
            throw new Exception("Erro ao buscar curso: " . $e->getMessage());
        }
    }

    function inserir(Curso $curso) {
        try {
            
            $coordenadorCpf = $curso->getCoordenadorCpf();
            
            if ($coordenadorCpf && !empty(trim($coordenadorCpf))) {
                $sql = "INSERT INTO CURSOS(codigo, nome, modalidade, carga_horaria, duracao, coordenador_cpf) VALUES (:codigo, :nome, :modalidade, :carga_horaria, :duracao, :coordenador_cpf)";
                $params = [
                    ':codigo' => $curso->getCodigo(),
                    ':nome' => $curso->getNome(),
                    ':modalidade' => $curso->getModalidade(),
                    ':carga_horaria' => $curso->getCargaHoraria(),
                    ':duracao' => $curso->getDuracao(),
                    ':coordenador_cpf' => $coordenadorCpf
                ];
            } else {
                
                $sql = "INSERT INTO CURSOS(codigo, nome, modalidade, carga_horaria, duracao, coordenador_cpf) VALUES (:codigo, :nome, :modalidade, :carga_horaria, :duracao, NULL)";
                $params = [
                    ':codigo' => $curso->getCodigo(),
                    ':nome' => $curso->getNome(),
                    ':modalidade' => $curso->getModalidade(),
                    ':carga_horaria' => $curso->getCargaHoraria(),
                    ':duracao' => $curso->getDuracao()
                ];
            }
            
            $stmt = $this->pdo->prepare($sql);
            $resultado = $stmt->execute($params);

            if (!$resultado) {
                $errorInfo = $stmt->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao inserir curso', $errorInfo[1] ?? 0);
            }

            return $this->buscarPorId($curso->getCodigo());
        } catch (PDOException $e) {
            
            if (strpos($e->getMessage(), '1452') !== false || strpos($e->getMessage(), 'foreign key') !== false) {
                throw new Exception("Erro: CPF do coordenador não encontrado na tabela de servidores. Certifique-se de que o servidor está cadastrado antes de atribuí-lo como coordenador.");
            }
            throw $e;
        }
    }

    function editar($id, $curso) {
        try {
            $c = $this->buscarPorId($id);
            if (!$c) 
                throw new Exception("Curso não encontrado!");

            $coordenadorCpf = $curso->getCoordenadorCpf();
            
            
            if ($coordenadorCpf && !empty(trim($coordenadorCpf))) {
                $sql = "UPDATE CURSOS SET nome=:nome, modalidade=:modalidade, carga_horaria=:carga_horaria, duracao=:duracao, coordenador_cpf=:coordenador_cpf WHERE codigo=:id";
                $params = [
                    ':nome' => $curso->getNome(),
                    ':modalidade' => $curso->getModalidade(),
                    ':carga_horaria' => $curso->getCargaHoraria(),
                    ':duracao' => $curso->getDuracao(),
                    ':coordenador_cpf' => $coordenadorCpf,
                    ':id' => $id
                ];
            } else {
                $sql = "UPDATE CURSOS SET nome=:nome, modalidade=:modalidade, carga_horaria=:carga_horaria, duracao=:duracao, coordenador_cpf=NULL WHERE codigo=:id";
                $params = [
                    ':nome' => $curso->getNome(),
                    ':modalidade' => $curso->getModalidade(),
                    ':carga_horaria' => $curso->getCargaHoraria(),
                    ':duracao' => $curso->getDuracao(),
                    ':id' => $id
                ];
            }
            
            $query = $this->pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $query->bindValue($key, $value);
            }
            
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao atualizar registro', $errorInfo[1] ?? 0);
            }

            $c->setNome($curso->getNome());
            $c->setModalidade($curso->getModalidade());
            $c->setCargaHoraria($curso->getCargaHoraria());
            $c->setDuracao($curso->getDuracao());
            $c->setCoordenadorCpf($coordenadorCpf);
            return $c;
        } catch (PDOException $e) {
            
            if (strpos($e->getMessage(), '1452') !== false || strpos($e->getMessage(), 'foreign key') !== false) {
                throw new Exception("Erro: CPF do coordenador não encontrado na tabela de servidores. Certifique-se de que o servidor está cadastrado antes de atribuí-lo como coordenador.");
            }
            throw $e;
        }
    }

    function apagar($id) {
        try {
            $curso = $this->buscarPorId($id);
            if (!$curso) 
                throw new Exception("Curso não encontrado!");

            $sql = "DELETE FROM CURSOS WHERE codigo=:id";
            $query = $this->pdo->prepare($sql);
            $query->bindValue(':id', $id);
            if (!$query->execute()) {
                $errorInfo = $query->errorInfo();
                throw new PDOException($errorInfo[2] ?? 'Erro ao apagar registro', $errorInfo[1] ?? 0);
            }    

            return $curso;
        } catch (PDOException $e) {
            throw $e;
        }
    }
}
?>