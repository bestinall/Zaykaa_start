const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const gatewayDir = path.join(rootDir, 'microservices', 'api_gateway');
const userServiceDir = path.join(rootDir, 'microservices', 'user_service');
const chefServiceDir = path.join(rootDir, 'microservices', 'chef_service');
const bookingServiceDir = path.join(rootDir, 'microservices', 'booking_service');
const orderServiceDir = path.join(rootDir, 'microservices', 'order_service');
const legacyBackendDir = path.join(rootDir, 'zaykaa-backend');
const frontendDir = path.join(rootDir, 'zaykaa-frontend');
const isWindows = process.platform === 'win32';

let shuttingDown = false;
const children = [];

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function commandExists(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'ignore',
  });

  return !result.error && result.status === 0;
}

function resolveSystemPython() {
  const candidates = isWindows
    ? [
        { command: 'python', versionArgs: ['--version'] },
        { command: 'py', versionArgs: ['-3', '--version'] },
      ]
    : [
        { command: 'python3', versionArgs: ['--version'] },
        { command: 'python', versionArgs: ['--version'] },
      ];

  const resolved = candidates.find((candidate) =>
    commandExists(candidate.command, candidate.versionArgs)
  );

  return resolved ? resolved.command : null;
}

function resolveNpmCommand() {
  if (isWindows) {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm start'],
    };
  }

  return {
    command: 'npm',
    args: ['start'],
  };
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function stopChild(child) {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }

  if (isWindows) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
    return;
  }

  child.kill('SIGTERM');
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  log('\nStopping Zaykaa services...');

  children.forEach(stopChild);

  setTimeout(() => {
    process.exit(exitCode);
  }, 250);
}

function startProcess(name, command, args, cwd, extraEnv = {}) {
  log(`Starting ${name}...`);

  const child = spawn(command, args, {
    cwd,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const details =
      signal !== null
        ? `${name} stopped with signal ${signal}`
        : `${name} stopped with exit code ${code ?? 0}`;

    log(details);
    shutdown(code ?? 0);
  });

  child.on('error', (error) => {
    if (shuttingDown) {
      return;
    }

    log(`Failed to start ${name}: ${error.message}`);
    shutdown(1);
  });

  children.push(child);
}

function validateDirectories() {
  const requiredDirectories = [gatewayDir, userServiceDir, chefServiceDir, bookingServiceDir, orderServiceDir, legacyBackendDir, frontendDir];
  const missingDirectory = requiredDirectories.find((directory) => !fileExists(directory));

  if (missingDirectory) {
    throw new Error(`Required directory not found: ${missingDirectory}`);
  }
}

function pythonArgs(pythonCommand) {
  return pythonCommand === 'py' ? ['-3', 'app.py'] : ['app.py'];
}

function main() {
  validateDirectories();

  const systemPython = resolveSystemPython();
  const npmRunner = resolveNpmCommand();

  if (!systemPython) {
    throw new Error('Could not find a Python executable for the services.');
  }

  log('Launching Zaykaa from the project root...');
  log(`Gateway: ${gatewayDir}`);
  log(`User Service: ${userServiceDir}`);
  log(`Chef Service: ${chefServiceDir}`);
  log(`Booking Service: ${bookingServiceDir}`);
  log(`Order Service: ${orderServiceDir}`);
  log(`Legacy Backend: ${legacyBackendDir}`);
  log(`Frontend: ${frontendDir}`);
  log('Press Ctrl+C to stop all services.\n');

  const pythonEnv = {
    PYTHONUNBUFFERED: '1',
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1',
  };

  startProcess('user-service', systemPython, pythonArgs(systemPython), userServiceDir, pythonEnv);
  startProcess('chef-service', systemPython, pythonArgs(systemPython), chefServiceDir, pythonEnv);
  startProcess('booking-service', systemPython, pythonArgs(systemPython), bookingServiceDir, pythonEnv);
  startProcess('order-service', systemPython, pythonArgs(systemPython), orderServiceDir, pythonEnv);
  startProcess(
    'legacy-backend',
    systemPython,
    pythonArgs(systemPython),
    legacyBackendDir,
    {
      ...pythonEnv,
      PORT: '5002',
    }
  );
  startProcess('api-gateway', systemPython, pythonArgs(systemPython), gatewayDir, pythonEnv);
  startProcess('frontend', npmRunner.command, npmRunner.args, frontendDir);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('exit', () => {
  if (!shuttingDown) {
    children.forEach(stopChild);
  }
});

try {
  main();
} catch (error) {
  log(`Unable to launch Zaykaa: ${error.message}`);
  process.exit(1);
}
