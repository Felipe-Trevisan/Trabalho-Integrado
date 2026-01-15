<?php
class PeiGeral implements JsonSerializable {
    private $id;
    private $id_aluno;
    private $matricula;
    private $professor_siape;
    private $periodo;
    private $codigo_componente;
    private $necessidade_especifica;
    private $objetivo_geral;
    private $conteudos;
    private $parecer;
    private $dificuldades;
    private $interesses_habilidades;
    private $estrategias;
    private $observacoes;
    private $precisa_monitor;
    private $data_criacao;
    private $data_atualizacao;
    
    public function setId($id) { $this->id = $id; }
    public function getId() { return $this->id; }
    
    public function setIdAluno($id_aluno) { $this->id_aluno = $id_aluno; }
    public function getIdAluno() { return $this->id_aluno; }
    
    public function setMatricula($matricula) { $this->matricula = $matricula; }
    public function getMatricula() { return $this->matricula; }
    
    public function setProfessorSiape($professor_siape) { $this->professor_siape = $professor_siape; }
    public function getProfessorSiape() { return $this->professor_siape; }
    
    public function setPeriodo($periodo) { $this->periodo = $periodo; }
    public function getPeriodo() { return $this->periodo; }
    
    public function setCodigoComponente($codigo_componente) { $this->codigo_componente = $codigo_componente; }
    public function getCodigoComponente() { return $this->codigo_componente; }
    
    public function setNecessidadeEspecifica($necessidade_especifica) { $this->necessidade_especifica = $necessidade_especifica; }
    public function getNecessidadeEspecifica() { return $this->necessidade_especifica; }
    
    public function setObjetivoGeral($objetivo_geral) { $this->objetivo_geral = $objetivo_geral; }
    public function getObjetivoGeral() { return $this->objetivo_geral; }
    
    public function setConteudos($conteudos) { $this->conteudos = $conteudos; }
    public function getConteudos() { return $this->conteudos; }
    
    public function setParecer($parecer) { $this->parecer = $parecer; }
    public function getParecer() { return $this->parecer; }
    
    public function setDificuldades($dificuldades) { $this->dificuldades = $dificuldades; }
    public function getDificuldades() { return $this->dificuldades; }
    
    public function setInteressesHabilidades($interesses_habilidades) { $this->interesses_habilidades = $interesses_habilidades; }
    public function getInteressesHabilidades() { return $this->interesses_habilidades; }
    
    public function setEstrategias($estrategias) { $this->estrategias = $estrategias; }
    public function getEstrategias() { return $this->estrategias; }
    
    public function setObservacoes($observacoes) { $this->observacoes = $observacoes; }
    public function getObservacoes() { return $this->observacoes; }
    
    public function setPrecisaMonitor($precisa_monitor) { $this->precisa_monitor = $precisa_monitor; }
    public function getPrecisaMonitor() { return $this->precisa_monitor; }
    
    public function setDataCriacao($data_criacao) { $this->data_criacao = $data_criacao; }
    public function getDataCriacao() { return $this->data_criacao; }
    
    public function setDataAtualizacao($data_atualizacao) { $this->data_atualizacao = $data_atualizacao; }
    public function getDataAtualizacao() { return $this->data_atualizacao; }
    
    public function jsonSerialize() {
        return [
            'id' => $this->id,
            'id_aluno' => $this->id_aluno,
            'matricula' => $this->matricula,
            'professor_siape' => $this->professor_siape,
            'periodo' => $this->periodo,
            'codigo_componente' => $this->codigo_componente,
            'necessidade_especifica' => $this->necessidade_especifica,
            'objetivo_geral' => $this->objetivo_geral,
            'conteudos' => $this->conteudos,
            'parecer' => $this->parecer,
            'dificuldades' => $this->dificuldades,
            'interesses_habilidades' => $this->interesses_habilidades,
            'estrategias' => $this->estrategias,
            'observacoes' => $this->observacoes,
            'precisa_monitor' => $this->precisa_monitor,
            'data_criacao' => $this->data_criacao,
            'data_atualizacao' => $this->data_atualizacao
        ];
    }
}
?>