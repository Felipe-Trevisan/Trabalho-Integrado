<?php
class ComponenteCurricular implements JsonSerializable {
    private $codigo_componente;
    private $componente;
    private $carga_horaria;
    private $ementa;
    
    public function setCodigoComponente($codigo_componente) { 
        
        if ($codigo_componente !== null && ($codigo_componente <= 0 || $codigo_componente > 2147483647)) {
            
            return;
        }
        $this->codigo_componente = $codigo_componente; 
    }
    public function getCodigoComponente() { return $this->codigo_componente; }
    
    public function setComponente($componente) { $this->componente = $componente; }
    public function getComponente() { return $this->componente; }
    
    public function setCargaHoraria($carga_horaria) { $this->carga_horaria = $carga_horaria; }
    public function getCargaHoraria() { return $this->carga_horaria; }
    
    public function setEmenta($ementa) { $this->ementa = $ementa; }
    public function getEmenta() { return $this->ementa; }
    
    public function jsonSerialize() {
        return [
            'codigo_componente' => $this->codigo_componente,
            'componente' => $this->componente,
            'carga_horaria' => $this->carga_horaria,
            'ementa' => $this->ementa
        ];
    }
}
?>