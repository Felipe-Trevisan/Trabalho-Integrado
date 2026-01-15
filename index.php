<?php

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        
        $errorMsg = 'Erro interno do servidor';
        if (strpos($error['message'], 'syntax error') !== false) {
            $errorMsg = 'Erro de sintaxe no código: ' . basename($error['file']) . ' linha ' . $error['line'];
        }
        
        
        echo json_encode(['error' => $errorMsg], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
});


ob_start();


ini_set('display_errors', 0);
error_reporting(E_ALL);


header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    header('Content-Type: application/json; charset=utf-8');
    echo '{}';
    exit;
}


require_once __DIR__ . '/config/index.php';
require_once __DIR__ . '/lib/Auth.php';

function converterNomeController($palavra) {
    
    $mapeamento = [
        'estudantes' => 'EstudanteController',
        'cursos' => 'CursoController',
        'componentes' => 'ComponenteCurricularController',
        'matriculas' => 'MatriculaController',
        'usuarios' => 'UsuarioController',
        'servidores' => 'ServidorController',
        'necessidades' => 'NecessidadeEspecificaController',
        'estudantes-necessidades' => 'EstudanteNecessidadeController',
        'responsaveis' => 'ResponsavelController',
        'resp-estudantes' => 'RespEstudanteController',
        'pareceres' => 'ParecerController',
        'peis' => 'PeiGeralController',
        'adaptacoes' => 'PeiAdaptacaoController',
        'comentarios' => 'ComentarioController',
        'auth' => 'AuthController'
    ];
    
    if (isset($mapeamento[$palavra])) {
        return $mapeamento[$palavra];
    }
    
    
    return ucfirst(rtrim($palavra, 's')) . 'Controller';
}

function error($msg, $code = 404) {
    
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    
    $json = json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        
        die('{"error":"Erro ao processar resposta"}');
    }
    die($json);
}

spl_autoload_register(function($nomeDaClasse){
    try {
        $arquivo = __DIR__ . '/controllers/class.' . $nomeDaClasse . '.php';

        if (!file_exists($arquivo)) {
            error("Controller '$nomeDaClasse' não existe! Arquivo: $arquivo");
        }
        
        require_once $arquivo;
        
        
        if (!class_exists($nomeDaClasse)) {
            error("Classe '$nomeDaClasse' não foi encontrada no arquivo!");
        }
    } catch (Throwable $e) {
        error("Erro ao carregar controller '$nomeDaClasse': " . $e->getMessage());
    }
});

$method = $_SERVER['REQUEST_METHOD'];


$scriptName = dirname($_SERVER['SCRIPT_NAME']);
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$url = str_replace($scriptName, '', $requestUri);
$url = ltrim($url, '/');
$partes = array_filter(explode("/", $url));
$partes = array_values($partes); 



if ($partes[0] === 'auth' && count($partes) === 2) {
    try {
        require_once __DIR__ . '/controllers/class.AuthController.php';
        $controller = new AuthController();
        
        ob_clean();
        
        if ($partes[1] === 'login' && $method === 'POST') {
            try {
                $resultado = $controller->login();
                
                
                if (isset($resultado['error'])) {
                    ob_end_clean();
                    http_response_code(401);
                    header('Content-Type: application/json; charset=utf-8');
                    echo json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    exit;
                }
                
                
                if (!isset($resultado['token']) || empty($resultado['token'])) {
                    ob_end_clean();
                    http_response_code(500);
                    header('Content-Type: application/json; charset=utf-8');
                    echo json_encode(['error' => 'Erro ao gerar token de autenticação. Verifique os logs do servidor.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    exit;
                }
            } catch (Exception $e) {
                ob_end_clean();
                http_response_code(401);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                exit;
            }
        } elseif ($partes[1] === 'register' && $method === 'POST') {
            $resultado = $controller->register();
        } elseif ($partes[1] === 'alterar-senha' && $method === 'POST') {
            $resultado = $controller->alterarSenha();
        } else {
            ob_end_clean();
            error("Método não permitido para esta rota", 405);
            exit;
        }
        
        $json = json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        if ($json === false) {
            ob_end_clean();
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Erro ao serializar resposta'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
        
        ob_end_clean();
        echo $json;
        exit;
    } catch (PDOException $e) {
        ob_end_clean();
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        $errorMsg = 'Erro ao processar requisição. Verifique os dados e tente novamente.';
        
        if (strpos($e->getMessage(), 'Duplicate entry') !== false || $e->getCode() == 23000) {
            $errorMsg = 'Dados duplicados. Verifique se o usuário, email ou CPF já existe.';
        } elseif (strpos($e->getMessage(), 'doesn\'t exist') !== false) {
            $errorMsg = 'Erro de configuração do banco de dados.';
        }
        
        echo json_encode(['error' => $errorMsg], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Exception $e) {
        ob_end_clean();
        $code = ($partes[1] === 'login') ? 401 : 400;
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Error $e) {
        ob_end_clean();
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        $errorMsg = 'Erro interno do servidor: ' . $e->getMessage();
        if (strpos($e->getMessage(), 'JWT') !== false || strpos($e->getMessage(), 'vendor') !== false) {
            $errorMsg = 'Biblioteca JWT não encontrada. Execute "composer install" na raiz do projeto.';
        }
        echo json_encode(['error' => $errorMsg], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if ($method === 'POST' && count($partes) != 1) {
    error("Requisição inválida! POST requer 1 parte, recebido: " . count($partes));
}
if (in_array($method, ['PUT', 'DELETE']) && count($partes) != 2) {
    error("Requisição inválida! " . $method . " requer 2 partes, recebido: " . count($partes));
}
if ($method === 'GET' && (count($partes) < 1 || count($partes) > 2)) {
    error("Requisição inválida! GET requer 1-2 partes, recebido: " . count($partes));
}
if (empty($partes[0])) {
    error("Requisição inválida! Rota vazia.");
}


if ($partes[0] !== 'auth' && !Auth::check()) {
    ob_end_clean();
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Você não está autenticado.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$nomeDoController = converterNomeController($partes[0]);

try {
    
    if (!class_exists($nomeDoController)) {
        error("Controller '$nomeDoController' não encontrado. Verifique se o arquivo existe.", 500);
    }
    
    $controller = new $nomeDoController();
} catch (TypeError $e) {
    error("Erro ao criar controller '$nomeDoController': " . $e->getMessage(), 500);
} catch (Error $e) {
    error("Controller '$nomeDoController' não pôde ser instanciado: " . $e->getMessage(), 500);
} catch (Exception $e) {
    error("Erro ao criar controller '$nomeDoController': " . $e->getMessage(), 500);
}

try {
    
    ob_clean();
    
    
    if (!method_exists($controller, $method === 'GET' ? (count($partes) === 1 ? 'getTodos' : 'getPorId') : 
        ($method === 'POST' ? 'criar' : ($method === 'PUT' ? 'editar' : 'apagar')))) {
        error("Método não implementado no controller", 500);
    }
    
    $resultado = null;
    switch($method) {
        case 'GET':
            
            $queryParams = $_GET;
            if (count($partes) === 1 && isset($queryParams['professor']) && method_exists($controller, 'getPorProfessor')) {
                $resultado = $controller->getPorProfessor($queryParams['professor']);
            } else if (count($partes) === 1 && isset($queryParams['pei_adaptacao']) && method_exists($controller, 'getPorPeiAdaptacao')) {
                $resultado = $controller->getPorPeiAdaptacao($queryParams['pei_adaptacao']);
            } else {
                $resultado = (count($partes) === 1) 
                    ? $controller->getTodos() 
                    : $controller->getPorId($partes[1]);
            }
            break;
        case 'POST': 
            $resultado = $controller->criar();
            break;
        case 'PUT': 
            $resultado = $controller->editar($partes[1]);
            break;
        case 'DELETE':  
            $resultado = $controller->apagar($partes[1]);
            break;
        default: 
            ob_end_clean();
            error('Método inválido!', 405);
            return;
    }
    
    
    if ($resultado === null) {
        
        if (count($partes) > 1 && $method === 'GET') {
            $resultado = new stdClass();
        } else {
            $resultado = [];
        }
    }
    
    $json = json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    if ($json === false) {
        ob_end_clean();
        error('Erro ao serializar resposta: ' . json_last_error_msg(), 500);
        return;
    }
    
    
    ob_end_clean();
    echo $json;
    
}catch(PDOException $e) {
    
    ob_end_clean();
    $errorMsg = $e->getMessage();
    
    
    if (strpos($errorMsg, "doesn't exist") !== false || strpos($errorMsg, "Unknown database") !== false) {
        $userMsg = "Banco de dados 'napne' não existe. Execute o script estrutura.sql primeiro.";
    } elseif (strpos($errorMsg, "Table") !== false && strpos($errorMsg, "doesn't exist") !== false) {
        $userMsg = "Tabela não encontrada. Verifique se o banco de dados foi criado corretamente.";
    } elseif (strpos($errorMsg, "Access denied") !== false) {
        $userMsg = "Erro de autenticação no banco de dados. Verifique usuário e senha.";
    } elseif (strpos($errorMsg, "Connection refused") !== false || 
              strpos($errorMsg, "Connection timed out") !== false ||
              strpos($errorMsg, "Can't connect") !== false ||
              strpos($errorMsg, "MySQL não está rodando") !== false) {
        $userMsg = "MySQL não está rodando. Inicie o MySQL pelo XAMPP Control Panel.";
    } else {
        $userMsg = "Erro ao conectar com o banco de dados: " . $errorMsg;
    }
    
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $userMsg], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}catch(Exception $e) {
    ob_end_clean();
    $errorMsg = $e->getMessage();
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $errorMsg], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}catch(Error $e) {
    ob_end_clean();
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Erro interno do servidor'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}catch(Throwable $e) {
    ob_end_clean();
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Erro interno do servidor'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}


?>