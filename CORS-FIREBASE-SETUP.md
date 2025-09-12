# CONFIGURAÇÃO CORS FIREBASE STORAGE

## O que é CORS?
CORS (Cross-Origin Resource Sharing) permite que seu site local acesse o Firebase Storage.

## Como configurar:

### Método 1: Google Cloud Console (Recomendado)
1. Vá para: https://console.cloud.google.com/storage
2. Selecione o projeto: barbeariasamuelabreu
3. Clique no bucket do seu projeto
4. Vá na aba "Permissions"
5. Clique em "Add principal"
6. Adicione "allUsers" com role "Storage Object Viewer"

### Método 2: Arquivo cors.json (Via gcloud CLI)
Crie um arquivo cors.json:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type"]
  }
]
```

Execute:
```bash
gsutil cors set cors.json gs://barbeariasamuelabreu.appspot.com
```

### Método 3: Teste sem CORS (Temporário)
Se os métodos acima não funcionarem, use um servidor HTTP local:
```bash
# No diretório do projeto
python -m http.server 8000
# Depois acesse: http://localhost:8000/dashboard-modern.html
```

## Verificar se funcionou:
- Abra dashboard-modern.html
- Tente fazer upload de uma imagem  
- Veja o console do navegador (F12)
- Se não houver erros de CORS, está funcionando!