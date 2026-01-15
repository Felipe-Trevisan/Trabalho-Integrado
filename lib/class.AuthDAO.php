<?php
require_once "class.Banco.php";

class AuthDAO {
    private $pdo;

    function __construct() { 
        $this->pdo = Banco::conectar(); 
    }

    function login($username, $senha) {
        try {
            $sql = "SELECT u.siape, u.username, u.senha, s.nome, s.tipo, s.email, s.cpf 
                      FROM USUARIOS u 
                      LEFT JOIN SERVIDORES s ON u.siape = s.siape 
                    WHERE u.username = :username";
        
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':username' => $username]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
            if ($resultado) {
                $senhaValida = false;
                if (str_starts_with($resultado['senha'], '$2y$')) {
                    $senhaValida = password_verify($senha, $resultado['senha']);
                } else {
                    $senhaValida = ($senha === $resultado['senha']);
                }
                
                if ($senhaValida) {
                    
                    
                    $tipo = $resultado['tipo'] ?? '';
                    if (empty($tipo) && !empty($resultado['siape'])) {
                        $sqlTipo = "SELECT tipo FROM SERVIDORES WHERE siape = :siape";
                        $stmtTipo = $this->pdo->prepare($sqlTipo);
                        $stmtTipo->execute([':siape' => $resultado['siape']]);
                        $servidor = $stmtTipo->fetch(PDO::FETCH_ASSOC);
                        if ($servidor && !empty($servidor['tipo'])) {
                            $tipo = $servidor['tipo'];
                        }
                    }
                    
                return (object)[
                    'siape' => $resultado['siape'],
                    'username' => $resultado['username'],
                        'nome' => $resultado['nome'] ?? $resultado['username'] ?? '',
                        'tipo' => $tipo,
                    'email' => $resultado['email'] ?? '',
                    'cpf' => $resultado['cpf'] ?? ''
                ];
            }
        }
            
            return null;
        } catch (PDOException $e) {
            return null;
        }
    }

    function buscarPorSiape($siape) {
        try {
            $sql = "SELECT u.siape, u.username, s.nome, s.tipo, s.email, s.cpf 
                    FROM USUARIOS u 
                    LEFT JOIN SERVIDORES s ON u.siape = s.siape 
                    WHERE u.siape = :siape";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':siape' => $siape]);

            return $stmt->fetch(PDO::FETCH_OBJ) ?: false;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    function alterarSenha($siape, $senhaAtual, $novaSenha) {
        try {
            
            $sql = "SELECT senha FROM USUARIOS WHERE siape = :siape";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':siape' => $siape]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$usuario) {
                return ['success' => false, 'message' => 'Usuário não encontrado'];
            }
            
            
            $senhaAtualValida = false;
            if (str_starts_with($usuario['senha'], '$2y$')) {
                $senhaAtualValida = password_verify($senhaAtual, $usuario['senha']);
            } else {
                $senhaAtualValida = ($senhaAtual === $usuario['senha']);
            }
            
            if (!$senhaAtualValida) {
                return ['success' => false, 'message' => 'Senha atual incorreta'];
            }
            
            
            $novaSenhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);
            
            
            $updateSql = "UPDATE USUARIOS SET senha = :nova_senha WHERE siape = :siape";
            $updateStmt = $this->pdo->prepare($updateSql);
            $resultado = $updateStmt->execute([
                ':nova_senha' => $novaSenhaHash,
                ':siape' => $siape
            ]);
            
            return $resultado ? 
                ['success' => true, 'message' => 'Senha alterada com sucesso'] : 
                ['success' => false, 'message' => 'Erro ao alterar senha'];
                
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Erro interno'];
        }
    }
    
}
?>