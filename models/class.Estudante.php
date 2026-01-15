<?php
class Estudante implements JsonSerializable {
    private $id_aluno;
    private $cpf;
    private $nome;
    private $contato;
    private $matricula;
    private $precisa_atendimento_psicopedagogico;
    private $historico;
    
    public function setIdAluno($id_aluno) { $this->id_aluno = $id_aluno; }
    public function getIdAluno() { return $this->id_aluno; }
    
    public function setCpf($cpf) { $this->cpf = $cpf; }
    public function getCpf() { return $this->cpf; }
    
    public function setNome($nome) { $this->nome = $nome; }
    public function getNome() { return $this->nome; }
    
    public function setContato($contato) { $this->contato = $contato; }
    public function getContato() { return $this->contato; }
    
    public function setMatricula($matricula) { $this->matricula = $matricula; }
    public function getMatricula() { return $this->matricula; }
    
    public function setPrecisaAtendimentoPsicopedagogico($precisa_atendimento_psicopedagogico) { $this->precisa_atendimento_psicopedagogico = $precisa_atendimento_psicopedagogico; }
    public function getPrecisaAtendimentoPsicopedagogico() { return $this->precisa_atendimento_psicopedagogico; }
    
    public function setHistorico($historico) { $this->historico = $historico; }
    public function getHistorico() { return $this->historico; }
    
    public function jsonSerialize() {
        return [
            'id_aluno' => $this->id_aluno,
            'cpf' => $this->cpf,
            'nome' => $this->nome,
            'contato' => $this->contato,
            'matricula' => $this->matricula,
            'precisa_atendimento_psicopedagogico' => $this->precisa_atendimento_psicopedagogico,
            'historico' => $this->historico
        ];
    }
}
?>