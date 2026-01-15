<?php
class Parecer implements JsonSerializable {
    private $id;
    private $pei_adaptacao_id;
    private $professor_siape;
    private $periodo;
    private $descricao;
    private $data_criacao;
    private $data_atualizacao;
    
    public function setId($id) { $this->id = $id; }
    public function getId() { return $this->id; }
    
    public function setPeiAdaptacaoId($pei_adaptacao_id) { $this->pei_adaptacao_id = $pei_adaptacao_id; }
    public function getPeiAdaptacaoId() { return $this->pei_adaptacao_id; }
    
    public function setProfessorSiape($professor_siape) { $this->professor_siape = $professor_siape; }
    public function getProfessorSiape() { return $this->professor_siape; }
    
    public function setPeriodo($periodo) { $this->periodo = $periodo; }
    public function getPeriodo() { return $this->periodo; }
    
    public function setDescricao($descricao) { $this->descricao = $descricao; }
    public function getDescricao() { return $this->descricao; }
    
    public function setDataCriacao($data_criacao) { $this->data_criacao = $data_criacao; }
    public function getDataCriacao() { return $this->data_criacao; }
    
    public function setDataAtualizacao($data_atualizacao) { $this->data_atualizacao = $data_atualizacao; }
    public function getDataAtualizacao() { return $this->data_atualizacao; }
    
    
    public function jsonSerialize() {
        return [
            'id' => $this->id,
            'pei_adaptacao_id' => $this->pei_adaptacao_id,
            'professor_siape' => $this->professor_siape,
            'periodo' => $this->periodo,
            'descricao' => $this->descricao,
            'data_criacao' => $this->data_criacao,
            'data_atualizacao' => $this->data_atualizacao
        ];
    }
}
?>