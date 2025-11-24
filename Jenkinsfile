pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install deps') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Unit tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('E2E tests') {
            steps {
                sh 'npm run test:e2e'
            }
        }

        stage('Cucumber integration tests') {
            when {
                expression { return false }
            }
            steps {
                sh 'npm run cucumber:integration'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
    }
}
