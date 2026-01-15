<?php
class EstudanteNecessidade implements JsonSerializable {
    private $estudante_cpf;
    private $necessidade_id;
    
    public function setEstudanteCpf($estudante_cpf) { $this->estudante_cpf = $estudante_cpf; }
    public function getEstudanteCpf() { return $this->estudante_cpf; }
    
    public function setNecessidadeId($necessidade_id) { $this->necessidade_id = $necessidade_id; }
    public function getNecessidadeId() { return $this->necessidade_id; }
    
    public function jsonSerialize() {
        return [
            'estudante_cpf' => $this->estudante_cpf,
            'necessidade_id' => $this->necessidade_id
        ];
    }
}
?>