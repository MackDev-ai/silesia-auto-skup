import { pbkdf2Sync, randomBytes } from 'node:crypto';
import process from 'node:process';

function readHiddenPassword() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Uruchom polecenie w interaktywnym terminalu.');
  }
  return new Promise((resolve, reject) => {
    let password = '';
    process.stdout.write('Nowe hasło administratora (minimum 14 znaków): ');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      process.stdout.write('\n');
    };

    const onData = (character) => {
      if (character === '\u0003') {
        finish();
        reject(new Error('Przerwano.'));
      } else if (character === '\r' || character === '\n') {
        finish();
        resolve(password);
      } else if (character === '\u007f' || character === '\b') {
        if (password.length) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (character >= ' ') {
        password += character;
        process.stdout.write('*');
      }
    };
    process.stdin.on('data', onData);
  });
}

const password = await readHiddenPassword();
if (password.length < 14) throw new Error('Hasło musi mieć co najmniej 14 znaków.');
// Cloudflare Workers currently reject PBKDF2 iteration counts above 100,000.
const iterations = 100_000;
const salt = randomBytes(18).toString('base64url');
const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
process.stdout.write(
  `Wartość ADMIN_PASSWORD_HASH:\npbkdf2_sha256$${iterations}$${salt}$${hash.toString('base64url')}\n`,
);
