<?php
class PeiAdaptacao implements JsonSerializable {
    private $id;
    private $pei_geral_id;
    private $codigo_componente;
    private $professor_siape;
    private $ementa;
    private $objetivos_especificos;
    private $metodologia;
    private $avaliacao;
    private $parecer;
    private $status;
    private $comentarios_napne;
    private $data_criacao;
    private $data_atualizacao;
    private $data_envio_napne;
    private $data_resposta_napne;
    private $docente; 
    
    public function setId($id) { $this->id = $id; }
    public function getId() { return $this->id; }
    
    public function setPeiGeralId($pei_geral_id) { $this->pei_geral_id = $pei_geral_id; }
    public function getPeiGeralId() { return $this->pei_geral_id; }
    
    public function setCodigoComponente($codigo_componente) { $this->codigo_componente = $codigo_componente; }
    public function getCodigoComponente() { return $this->codigo_componente; }
    
    public function setProfessorSiape($professor_siape) { $this->professor_siape = $professor_siape; }
    public function getProfessorSiape() { return $this->professor_siape; }
    
    public function setEmenta($ementa) { $this->ementa = $ementa; }
    public function getEmenta() { return $this->ementa; }
    
    public function setObjetivosEspecificos($objetivos_especificos) { $this->objetivos_especificos = $objetivos_especificos; }
    public function getObjetivosEspecificos() { return $this->objetivos_especificos; }
    
    public function setMetodologia($metodologia) { $this->metodologia = $metodologia; }
    public function getMetodologia() { return $this->metodologia; }
    
    public function setAvaliacao($avaliacao) { $this->avaliacao = $avaliacao; }
    public function getAvaliacao() { return $this->avaliacao; }
    
    public function setParecer($parecer) { $this->parecer = $parecer; }
    public function getParecer() { return $this->parecer; }
    
    public function setStatus($status) { $this->status = $status; }
    public function getStatus() { return $this->status; }
    
    public function setComentariosNapne($comentarios_napne) { $this->comentarios_napne = $comentarios_napne; }
    public function getComentariosNapne() { return $this->comentarios_napne; }
    
    public function setDataCriacao($data_criacao) { $this->data_criacao = $data_criacao; }
    public function getDataCriacao() { return $this->data_criacao; }
    
    public function setDataAtualizacao($data_atualizacao) { $this->data_atualizacao = $data_atualizacao; }
    public function getDataAtualizacao() { return $this->data_atualizacao; }
    
    public function setDataEnvioNapne($data_envio_napne) { $this->data_envio_napne = $data_envio_napne; }
    public function getDataEnvioNapne() { return $this->data_envio_napne; }
    
    public function setDataRespostaNapne($data_resposta_napne) { $this->data_resposta_napne = $data_resposta_napne; }
    public function getDataRespostaNapne() { return $this->data_resposta_napne; }
    
    public function setDocente($docente) { $this->docente = $docente; }
    public function getDocente() { return $this->docente; }
    
    public function jsonSerialize() {
        return [
            'id' => $this->id,
            'pei_geral_id' => $this->pei_geral_id,
            'codigo_componente' => $this->codigo_componente,
            'professor_siape' => $this->professor_siape,
            'ementa' => $this->ementa,
            'objetivos_especificos' => $this->objetivos_especificos,
            'metodologia' => $this->metodologia,
            'avaliacao' => $this->avaliacao,
            'parecer' => $this->parecer,
            'status' => $this->status,
            'comentarios_napne' => $this->comentarios_napne,
            'data_criacao' => $this->data_criacao,
            'data_atualizacao' => $this->data_atualizacao,
            'data_envio_napne' => $this->data_envio_napne,
            'data_resposta_napne' => $this->data_resposta_napne,
            'docente' => isset($this->docente) ? $this->docente : null 
        ];
    }
}
?>