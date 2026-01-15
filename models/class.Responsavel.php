<?php
class Responsavel implements JsonSerializable {
    private $id_responsavel;
    private $nome_responsavel;
    private $cpf_responsavel;
    private $contato_responsavel;
    private $endereco_responsavel;
    
    public function setIdResponsavel($id_responsavel) { $this->id_responsavel = $id_responsavel; }
    public function getIdResponsavel() { return $this->id_responsavel; }
    
    public function setNomeResponsavel($nome_responsavel) { $this->nome_responsavel = $nome_responsavel; }
    public function getNomeResponsavel() { return $this->nome_responsavel; }
    
    public function setCpfResponsavel($cpf_responsavel) { $this->cpf_responsavel = $cpf_responsavel; }
    public function getCpfResponsavel() { return $this->cpf_responsavel; }
    
    public function setContatoResponsavel($contato_responsavel) { $this->contato_responsavel = $contato_responsavel; }
    public function getContatoResponsavel() { return $this->contato_responsavel; }
    
    public function setEnderecoResponsavel($endereco_responsavel) { $this->endereco_responsavel = $endereco_responsavel; }
    public function getEnderecoResponsavel() { return $this->endereco_responsavel; }
    
    public function jsonSerialize() {
        return [
            'id_responsavel' => $this->id_responsavel,
            'nome_responsavel' => $this->nome_responsavel,
            'cpf_responsavel' => $this->cpf_responsavel,
            'contato_responsavel' => $this->contato_responsavel,
            'endereco_responsavel' => $this->endereco_responsavel
        ];
    }
}
?>