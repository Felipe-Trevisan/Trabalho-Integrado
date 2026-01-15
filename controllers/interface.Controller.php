<?php
interface Controller {
    function getTodos();
    function getPorId($id);
    function criar();
    function editar($id);
    function apagar($id);
}

?>