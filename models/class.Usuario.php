<?php
class Usuario implements JsonSerializable {
    private $siape;
    private $username;
    private $senha;
    
    public function setSiape($siape) { $this->siape = $siape; }
    public function getSiape() { return $this->siape; }
    
    public function setUsername($username) { $this->username = $username; }
    public function getUsername() { return $this->username; }
    
    public function setSenha($senha) { $this->senha = $senha; }
    public function getSenha() { return $this->senha; }
    
    public function jsonSerialize() {
        return [
            'siape' => $this->siape,
            'username' => $this->username,
            'senha' => $this->senha
            
        ];
    }
}
?>