<?php
class RespEstudante implements JsonSerializable {
    private $id_responsavel;
    private $id_aluno;
    
    public function setIdResponsavel($id_responsavel) { $this->id_responsavel = $id_responsavel; }
    public function getIdResponsavel() { return $this->id_responsavel; }
    
    public function setIdAluno($id_aluno) { $this->id_aluno = $id_aluno; }
    public function getIdAluno() { return $this->id_aluno; }
    
    public function jsonSerialize() {
        return [
            'id_responsavel' => $this->id_responsavel,
            'id_aluno' => $this->id_aluno
        ];
    }
}
?>