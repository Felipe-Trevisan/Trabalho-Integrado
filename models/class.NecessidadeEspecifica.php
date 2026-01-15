<?php
class NecessidadeEspecifica implements JsonSerializable {
    private $necessidade_id;
    private $nome;
    private $descricao;
    
    public function setNecessidadeId($necessidade_id) { $this->necessidade_id = $necessidade_id; }
    public function getNecessidadeId() { return $this->necessidade_id; }
    
    public function setNome($nome) { $this->nome = $nome; }
    public function getNome() { return $this->nome; }
    
    public function setDescricao($descricao) { $this->descricao = $descricao; }
    public function getDescricao() { return $this->descricao; }
    
    public function jsonSerialize() {
        return [
            'necessidade_id' => $this->necessidade_id,
            'nome' => $this->nome,
            'descricao' => $this->descricao
        ];
    }
}
?>