<?php
class Comentario implements JsonSerializable {
    private $id;
    private $parecer_id;
    private $usuario_id;
    private $data;
    private $comentarios;
    
    public function setId($id) { $this->id = $id; }
    public function getId() { return $this->id; }
    
    public function setParecerId($parecer_id) { $this->parecer_id = $parecer_id; }
    public function getParecerId() { return $this->parecer_id; }
    
    public function setUsuarioId($usuario_id) { $this->usuario_id = $usuario_id; }
    public function getUsuarioId() { return $this->usuario_id; }
    
    public function setData($data) { $this->data = $data; }
    public function getData() { return $this->data; }
    
    public function setComentarios($comentarios) { $this->comentarios = $comentarios; }
    public function getComentarios() { return $this->comentarios; }
    
    public function jsonSerialize() {
        return [
            'id' => $this->id,
            'parecer_id' => $this->parecer_id,
            'usuario_id' => $this->usuario_id,
            'data' => $this->data,
            'comentarios' => $this->comentarios
            
        ];
    }
}
?>