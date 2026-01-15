<?php
class Curso implements JsonSerializable {
    private $codigo;
    private $nome;
    private $modalidade;
    private $carga_horaria;
    private $duracao;
    private $coordenador_cpf;
    
    public function setCodigo($codigo) { $this->codigo = $codigo; }
    public function getCodigo() { return $this->codigo; }
    
    public function setNome($nome) { $this->nome = $nome; }
    public function getNome() { return $this->nome; }
    
    public function setModalidade($modalidade) { $this->modalidade = $modalidade; }
    public function getModalidade() { return $this->modalidade; }
    
    public function setCargaHoraria($carga_horaria) { $this->carga_horaria = $carga_horaria; }
    public function getCargaHoraria() { return $this->carga_horaria; }
    
    public function setDuracao($duracao) { $this->duracao = $duracao; }
    public function getDuracao() { return $this->duracao; }
    
    public function setCoordenadorCpf($coordenador_cpf) { $this->coordenador_cpf = $coordenador_cpf; }
    public function getCoordenadorCpf() { return $this->coordenador_cpf; }
    
    public function jsonSerialize() {
        return [
            'codigo' => $this->codigo,
            'nome' => $this->nome,
            'modalidade' => $this->modalidade,
            'carga_horaria' => $this->carga_horaria,
            'duracao' => $this->duracao,
            'coordenador_cpf' => $this->coordenador_cpf
            
        ];
    }
}
?>