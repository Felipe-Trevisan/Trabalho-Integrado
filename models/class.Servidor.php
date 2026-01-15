<?php
class Servidor implements JsonSerializable {
    private $siape;
    private $cpf;
    private $nome;
    private $email;
    private $telefone;
    private $tipo;
    
    public function setSiape($siape) { $this->siape = $siape; }
    public function getSiape() { return $this->siape; }
    
    public function setCpf($cpf) { $this->cpf = $cpf; }
    public function getCpf() { return $this->cpf; }
    
    public function setNome($nome) { $this->nome = $nome; }
    public function getNome() { return $this->nome; }
    
    public function setEmail($email) { $this->email = $email; }
    public function getEmail() { return $this->email; }
    
    public function setTelefone($telefone) { $this->telefone = $telefone; }
    public function getTelefone() { return $this->telefone; }
    
    public function setTipo($tipo) { $this->tipo = $tipo; }
    public function getTipo() { return $this->tipo; }
    
    public function jsonSerialize() {
        return [
            'siape' => $this->siape,
            'cpf' => $this->cpf,
            'nome' => $this->nome,
            'email' => $this->email,
            'telefone' => $this->telefone,
            'tipo' => $this->tipo
        ];
    }
}
?>