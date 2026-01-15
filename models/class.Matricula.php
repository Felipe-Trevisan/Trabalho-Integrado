<?php
class Matricula implements JsonSerializable {
    private $matricula;
    private $estudante_id;
    private $curso_id;
    private $ativo;
    
    public function setMatricula($matricula) { $this->matricula = $matricula; }
    public function getMatricula() { return $this->matricula; }
    
    public function setEstudanteId($estudante_id) { $this->estudante_id = $estudante_id; }
    public function getEstudanteId() { return $this->estudante_id; }
    
    public function setCursoId($curso_id) { $this->curso_id = $curso_id; }
    public function getCursoId() { return $this->curso_id; }
    
    public function setAtivo($ativo) { $this->ativo = $ativo; }
    public function getAtivo() { return $this->ativo; }
    
    public function jsonSerialize() {
        return [
            'matricula' => $this->matricula,
            'estudante_id' => $this->estudante_id,
            'curso_id' => $this->curso_id,
            'ativo' => $this->ativo
            
        ];
    }
}
?>