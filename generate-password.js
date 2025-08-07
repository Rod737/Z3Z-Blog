const bcrypt = require('bcryptjs');

// Gerar hash da senha
const password = 'admin123'; // Senha padrão
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Erro ao gerar hash:', err);
        return;
    }
    
    console.log('Senha:', password);
    console.log('Hash:', hash);
    console.log('\nAtualize o arquivo data/admin.json com este hash.');
});

// Verificar hash existente
const existingHash = '$2a$10$rQJ4RqM8kP4FvL7Q9H5c8.vx7K5uLh4J4b9fvqfJ4K5vL7Q9H5c8O';
bcrypt.compare(password, existingHash, (err, result) => {
    if (err) {
        console.error('Erro ao verificar hash:', err);
        return;
    }
    console.log(`\nVerificação do hash existente: ${result ? 'VÁLIDO' : 'INVÁLIDO'}`);
});