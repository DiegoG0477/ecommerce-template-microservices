pipeline {
    agent any

    environment {
        REPO_URL = 'https://github.com/DiegoG0477/ecommerce-template-microservices.git' // Assuming this is the monorepo URL
        SSH_CRED_ID = 'ssh-key-ec2'
        EC2_USER = 'ubuntu'
        // Base remote path for the monorepo
        REMOTE_BASE_PATH = '/home/ubuntu/ecommerce-template-microservices'

        // IPs for api-gateway
        API_GATEWAY_EC2_IP_PROD = 'YOUR_API_GATEWAY_PROD_IP' // Placeholder
        API_GATEWAY_EC2_IP_DEV = 'YOUR_API_GATEWAY_DEV_IP'   // Placeholder
        API_GATEWAY_EC2_IP_QA = 'YOUR_API_GATEWAY_QA_IP'     // Placeholder

        // IPs for cart-service
        CART_SERVICE_EC2_IP_PROD = 'YOUR_CART_SERVICE_PROD_IP' // Placeholder
        CART_SERVICE_EC2_IP_DEV = 'YOUR_CART_SERVICE_DEV_IP'   // Placeholder
        CART_SERVICE_EC2_IP_QA = 'YOUR_CART_SERVICE_QA_IP'     // Placeholder
    }

    stages {
        stage('Setup Environment') {
            steps {
                script {
                    def branch = env.GIT_BRANCH
                    if (!branch) {
                        env.DEPLOY_ENV = 'none'
                        echo "No se detectó rama, no se desplegará."
                        return
                    }
                    branch = branch.replaceAll('origin/', '')
                    echo "Rama detectada: ${branch}"

                    switch(branch) {
                        case 'master': // Assuming master is production
                            env.DEPLOY_ENV = 'production'
                            env.NODE_ENV = 'production'
                            env.API_GATEWAY_CURRENT_IP = env.API_GATEWAY_EC2_IP_PROD
                            env.CART_SERVICE_CURRENT_IP = env.CART_SERVICE_EC2_IP_PROD
                            break
                        case 'dev':
                            env.DEPLOY_ENV = 'development'
                            env.NODE_ENV = 'development'
                            env.API_GATEWAY_CURRENT_IP = env.API_GATEWAY_EC2_IP_DEV
                            env.CART_SERVICE_CURRENT_IP = env.CART_SERVICE_EC2_IP_DEV
                            break
                        case 'qa':
                            env.DEPLOY_ENV = 'qa'
                            env.NODE_ENV = 'qa'
                            env.API_GATEWAY_CURRENT_IP = env.API_GATEWAY_EC2_IP_QA
                            env.CART_SERVICE_CURRENT_IP = env.CART_SERVICE_EC2_IP_QA
                            break
                        default:
                            env.DEPLOY_ENV = 'none'
                            echo "No hay despliegue configurado para esta rama: ${branch}"
                    }
                }
            }
        }

        stage('Checkout Monorepo') {
            when {
                expression { env.DEPLOY_ENV != 'none' }
            }
            steps {
                git branch: env.GIT_BRANCH.replaceAll('origin/', ''), url: "${REPO_URL}"
            }
        }

        stage('Build API Gateway') {
            when {
                expression { env.DEPLOY_ENV != 'none' }
                changeset 'apps/api-gateway/**'
            }
            steps {
                dir('apps/api-gateway') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy API Gateway') {
            when {
                expression { env.DEPLOY_ENV != 'none' }
                changeset 'apps/api-gateway/**'
            }
            steps {
                script {
                    def sshKeyId = env.SSH_CRED_ID
                    def remotePath = "${env.REMOTE_BASE_PATH}/apps/api-gateway"
                    def appName = 'api-gateway'
                    def branchName = env.GIT_BRANCH.replaceAll('origin/', '')

                    def creds = [
                        sshUserPrivateKey(credentialsId: sshKeyId, keyFileVariable: 'SSH_KEY')
                    ]

                    // Add API Gateway specific credentials based on environment
                    if (env.DEPLOY_ENV == 'production') {
                        creds.add(string(credentialsId: 'api-gateway-prod-port', variable: 'APP_PORT'))
                        creds.add(string(credentialsId: 'api-gateway-prod-db-host', variable: 'DB_HOST'))
                        creds.add(string(credentialsId: 'api-gateway-prod-db-port', variable: 'DB_PORT'))
                        creds.add(string(credentialsId: 'api-gateway-prod-db-user', variable: 'DB_USER'))
                        creds.add(string(credentialsId: 'api-gateway-prod-db-password', variable: 'DB_PASSWORD'))
                        creds.add(string(credentialsId: 'api-gateway-prod-secret-jwt', variable: 'SECRET_JWT'))
                        creds.add(string(credentialsId: 'api-gateway-prod-db-database', variable: 'DB_DATABASE'))
                        creds.add(string(credentialsId: 'api-gateway-prod-db-name', variable: 'DB_NAME'))
                        creds.add(string(credentialsId: 'api-gateway-prod-gateway-port', variable: 'GATEWAY_PORT'))
                        creds.add(string(credentialsId: 'api-gateway-prod-jwt-secret', variable: 'JWT_SECRET'))
                        creds.add(string(credentialsId: 'api-gateway-prod-jwt-expiration-time', variable: 'JWT_EXPIRATION_TIME'))
                        creds.add(string(credentialsId: 'api-gateway-prod-user-service-url', variable: 'USER_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-prod-user-service-base-path', variable: 'USER_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-prod-product-service-url', variable: 'PRODUCT_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-prod-product-service-base-path', variable: 'PRODUCT_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-prod-cart-service-url', variable: 'CART_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-prod-cart-service-base-path', variable: 'CART_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-prod-stock-service-url', variable: 'STOCK_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-prod-stock-service-base-path', variable: 'STOCK_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-prod-order-service-url', variable: 'ORDER_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-prod-order-service-base-path', variable: 'ORDER_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-prod-user-service-api-key', variable: 'USER_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-prod-product-service-api-key', variable: 'PRODUCT_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-prod-cart-service-api-key', variable: 'CART_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-prod-stock-service-api-key', variable: 'STOCK_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-prod-order-service-api-key', variable: 'ORDER_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-prod-swagger-gateway-server-url', variable: 'SWAGGER_GATEWAY_SERVER_URL'))
                        creds.add(string(credentialsId: 'api-gateway-prod-http-timeout', variable: 'HTTP_TIMEOUT'))
                        creds.add(string(credentialsId: 'api-gateway-prod-http-max-redirects', variable: 'HTTP_MAX_REDIRECTS'))
                    } else if (env.DEPLOY_ENV == 'development') {
                        creds.add(string(credentialsId: 'api-gateway-dev-port', variable: 'APP_PORT'))
                        creds.add(string(credentialsId: 'api-gateway-dev-db-host', variable: 'DB_HOST'))
                        creds.add(string(credentialsId: 'api-gateway-dev-db-port', variable: 'DB_PORT'))
                        creds.add(string(credentialsId: 'api-gateway-dev-db-user', variable: 'DB_USER'))
                        creds.add(string(credentialsId: 'api-gateway-dev-db-password', variable: 'DB_PASSWORD'))
                        creds.add(string(credentialsId: 'api-gateway-dev-secret-jwt', variable: 'SECRET_JWT'))
                        creds.add(string(credentialsId: 'api-gateway-dev-db-database', variable: 'DB_DATABASE'))
                        creds.add(string(credentialsId: 'api-gateway-dev-db-name', variable: 'DB_NAME'))
                        creds.add(string(credentialsId: 'api-gateway-dev-gateway-port', variable: 'GATEWAY_PORT'))
                        creds.add(string(credentialsId: 'api-gateway-dev-jwt-secret', variable: 'JWT_SECRET'))
                        creds.add(string(credentialsId: 'api-gateway-dev-jwt-expiration-time', variable: 'JWT_EXPIRATION_TIME'))
                        creds.add(string(credentialsId: 'api-gateway-dev-user-service-url', variable: 'USER_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-dev-user-service-base-path', variable: 'USER_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-dev-product-service-url', variable: 'PRODUCT_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-dev-product-service-base-path', variable: 'PRODUCT_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-dev-cart-service-url', variable: 'CART_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-dev-cart-service-base-path', variable: 'CART_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-dev-stock-service-url', variable: 'STOCK_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-dev-stock-service-base-path', variable: 'STOCK_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-dev-order-service-url', variable: 'ORDER_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-dev-order-service-base-path', variable: 'ORDER_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-dev-user-service-api-key', variable: 'USER_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-dev-product-service-api-key', variable: 'PRODUCT_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-dev-cart-service-api-key', variable: 'CART_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-dev-stock-service-api-key', variable: 'STOCK_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-dev-order-service-api-key', variable: 'ORDER_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-dev-swagger-gateway-server-url', variable: 'SWAGGER_GATEWAY_SERVER_URL'))
                        creds.add(string(credentialsId: 'api-gateway-dev-http-timeout', variable: 'HTTP_TIMEOUT'))
                        creds.add(string(credentialsId: 'api-gateway-dev-http-max-redirects', variable: 'HTTP_MAX_REDIRECTS'))
                    } else if (env.DEPLOY_ENV == 'qa') {
                        creds.add(string(credentialsId: 'api-gateway-qa-port', variable: 'APP_PORT'))
                        creds.add(string(credentialsId: 'api-gateway-qa-db-host', variable: 'DB_HOST'))
                        creds.add(string(credentialsId: 'api-gateway-qa-db-port', variable: 'DB_PORT'))
                        creds.add(string(credentialsId: 'api-gateway-qa-db-user', variable: 'DB_USER'))
                        creds.add(string(credentialsId: 'api-gateway-qa-db-password', variable: 'DB_PASSWORD'))
                        creds.add(string(credentialsId: 'api-gateway-qa-secret-jwt', variable: 'SECRET_JWT'))
                        creds.add(string(credentialsId: 'api-gateway-qa-db-database', variable: 'DB_DATABASE'))
                        creds.add(string(credentialsId: 'api-gateway-qa-db-name', variable: 'DB_NAME'))
                        creds.add(string(credentialsId: 'api-gateway-qa-gateway-port', variable: 'GATEWAY_PORT'))
                        creds.add(string(credentialsId: 'api-gateway-qa-jwt-secret', variable: 'JWT_SECRET'))
                        creds.add(string(credentialsId: 'api-gateway-qa-jwt-expiration-time', variable: 'JWT_EXPIRATION_TIME'))
                        creds.add(string(credentialsId: 'api-gateway-qa-user-service-url', variable: 'USER_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-qa-user-service-base-path', variable: 'USER_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-qa-product-service-url', variable: 'PRODUCT_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-qa-product-service-base-path', variable: 'PRODUCT_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-qa-cart-service-url', variable: 'CART_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-qa-cart-service-base-path', variable: 'CART_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-qa-stock-service-url', variable: 'STOCK_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-qa-stock-service-base-path', variable: 'STOCK_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-qa-order-service-url', variable: 'ORDER_SERVICE_URL'))
                        creds.add(string(credentialsId: 'api-gateway-qa-order-service-base-path', variable: 'ORDER_SERVICE_BASE_PATH'))
                        creds.add(string(credentialsId: 'api-gateway-qa-user-service-api-key', variable: 'USER_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-qa-product-service-api-key', variable: 'PRODUCT_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-qa-cart-service-api-key', variable: 'CART_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-qa-stock-service-api-key', variable: 'STOCK_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-qa-order-service-api-key', variable: 'ORDER_SERVICE_API_KEY'))
                        creds.add(string(credentialsId: 'api-gateway-qa-swagger-gateway-server-url', variable: 'SWAGGER_GATEWAY_SERVER_URL'))
                        creds.add(string(credentialsId: 'api-gateway-qa-http-timeout', variable: 'HTTP_TIMEOUT'))
                        creds.add(string(credentialsId: 'api-gateway-qa-http-max-redirects', variable: 'HTTP_MAX_REDIRECTS'))
                    }

                    withCredentials(creds) {
                        sh """
                        SSH_KEY=\$SSH_KEY \
                        EC2_USER=\$EC2_USER \
                        EC2_IP=\$API_GATEWAY_CURRENT_IP \
                        REMOTE_PATH=${remotePath} \
                        REPO_URL=\$REPO_URL \
                        APP_NAME=${appName} \
                        NODE_ENV=\$NODE_ENV \
                        GIT_BRANCH=${branchName} \
                        APP_PORT=\$APP_PORT \
                        DB_HOST=\$DB_HOST \
                        DB_PORT=\$DB_PORT \
                        DB_USER=\$DB_USER \
                        DB_PASSWORD=\$DB_PASSWORD \
                        SECRET_JWT=\$SECRET_JWT \
                        DB_DATABASE=\$DB_DATABASE \
                        DB_NAME=\$DB_NAME \
                        GATEWAY_PORT=\$GATEWAY_PORT \
                        JWT_SECRET=\$JWT_SECRET \
                        JWT_EXPIRATION_TIME=\$JWT_EXPIRATION_TIME \
                        USER_SERVICE_URL=\$USER_SERVICE_URL \
                        USER_SERVICE_BASE_PATH=\$USER_SERVICE_BASE_PATH \
                        PRODUCT_SERVICE_URL=\$PRODUCT_SERVICE_URL \
                        PRODUCT_SERVICE_BASE_PATH=\$PRODUCT_SERVICE_BASE_PATH \
                        CART_SERVICE_URL=\$CART_SERVICE_URL \
                        CART_SERVICE_BASE_PATH=\$CART_SERVICE_BASE_PATH \
                        STOCK_SERVICE_URL=\$STOCK_SERVICE_URL \
                        STOCK_SERVICE_BASE_PATH=\$STOCK_SERVICE_BASE_PATH \
                        ORDER_SERVICE_URL=\$ORDER_SERVICE_URL \
                        ORDER_SERVICE_BASE_PATH=\$ORDER_SERVICE_BASE_PATH \
                        USER_SERVICE_API_KEY=\$USER_SERVICE_API_KEY \
                        PRODUCT_SERVICE_API_KEY=\$PRODUCT_SERVICE_API_KEY \
                        CART_SERVICE_API_KEY=\$CART_SERVICE_API_KEY \
                        STOCK_SERVICE_API_KEY=\$STOCK_SERVICE_API_KEY \
                        ORDER_SERVICE_API_KEY=\$ORDER_SERVICE_API_KEY \
                        SWAGGER_GATEWAY_SERVER_URL=\$SWAGGER_GATEWAY_SERVER_URL \
                        HTTP_TIMEOUT=\$HTTP_TIMEOUT \
                        HTTP_MAX_REDIRECTS=\$HTTP_MAX_REDIRECTS \
                        ./apps/api-gateway/deploy.sh
                        """
                    }
                }
            }
        }

        stage('Build Cart Service') {
            when {
                expression { env.DEPLOY_ENV != 'none' }
                changeset 'apps/cart-service/**'
            }
            steps {
                dir('apps/cart-service') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy Cart Service') {
            when {
                expression { env.DEPLOY_ENV != 'none' }
                changeset 'apps/cart-service/**'
            }
            steps {
                script {
                    def sshKeyId = env.SSH_CRED_ID
                    def remotePath = "${env.REMOTE_BASE_PATH}/apps/cart-service"
                    def appName = 'cart-service'
                    def branchName = env.GIT_BRANCH.replaceAll('origin/', '')

                    def creds = [
                        sshUserPrivateKey(credentialsId: sshKeyId, keyFileVariable: 'SSH_KEY')
                    ]

                    // Add Cart Service specific credentials based on environment
                    if (env.DEPLOY_ENV == 'production') {
                        creds.add(string(credentialsId: 'cart-service-prod-port', variable: 'APP_PORT'))
                        creds.add(string(credentialsId: 'cart-service-prod-db-host', variable: 'DB_HOST'))
                        creds.add(string(credentialsId: 'cart-service-prod-db-port', variable: 'DB_PORT'))
                        creds.add(string(credentialsId: 'cart-service-prod-db-user', variable: 'DB_USER'))
                        creds.add(string(credentialsId: 'cart-service-prod-db-password', variable: 'DB_PASSWORD'))
                        creds.add(string(credentialsId: 'cart-service-prod-secret-jwt', variable: 'SECRET_JWT')) // Assuming cart-service might also need JWT
                        creds.add(string(credentialsId: 'cart-service-prod-db-database', variable: 'DB_DATABASE'))
                        creds.add(string(credentialsId: 'cart-service-prod-db-name', variable: 'DB_NAME'))
                    } else if (env.DEPLOY_ENV == 'development') {
                        creds.add(string(credentialsId: 'cart-service-dev-port', variable: 'APP_PORT'))
                        creds.add(string(credentialsId: 'cart-service-dev-db-host', variable: 'DB_HOST'))
                        creds.add(string(credentialsId: 'cart-service-dev-db-port', variable: 'DB_PORT'))
                        creds.add(string(credentialsId: 'cart-service-dev-db-user', variable: 'DB_USER'))
                        creds.add(string(credentialsId: 'cart-service-dev-db-password', variable: 'DB_PASSWORD'))
                        creds.add(string(credentialsId: 'cart-service-dev-secret-jwt', variable: 'SECRET_JWT'))
                        creds.add(string(credentialsId: 'cart-service-dev-db-database', variable: 'DB_DATABASE'))
                        creds.add(string(credentialsId: 'cart-service-dev-db-name', variable: 'DB_NAME'))
                    } else if (env.DEPLOY_ENV == 'qa') {
                        creds.add(string(credentialsId: 'cart-service-qa-port', variable: 'APP_PORT'))
                        creds.add(string(credentialsId: 'cart-service-qa-db-host', variable: 'DB_HOST'))
                        creds.add(string(credentialsId: 'cart-service-qa-db-port', variable: 'DB_PORT'))
                        creds.add(string(credentialsId: 'cart-service-qa-db-user', variable: 'DB_USER'))
                        creds.add(string(credentialsId: 'cart-service-qa-db-password', variable: 'DB_PASSWORD'))
                        creds.add(string(credentialsId: 'cart-service-qa-secret-jwt', variable: 'SECRET_JWT'))
                        creds.add(string(credentialsId: 'cart-service-qa-db-database', variable: 'DB_DATABASE'))
                        creds.add(string(credentialsId: 'cart-service-qa-db-name', variable: 'DB_NAME'))
                    }

                    withCredentials(creds) {
                        sh """
                        SSH_KEY=\$SSH_KEY \
                        EC2_USER=\$EC2_USER \
                        EC2_IP=\$CART_SERVICE_CURRENT_IP \
                        REMOTE_PATH=${remotePath} \
                        REPO_URL=\$REPO_URL \
                        APP_NAME=${appName} \
                        NODE_ENV=\$NODE_ENV \
                        GIT_BRANCH=${branchName} \
                        APP_PORT=\$APP_PORT \
                        DB_HOST=\$DB_HOST \
                        DB_PORT=\$DB_PORT \
                        DB_USER=\$DB_USER \
                        DB_PASSWORD=\$DB_PASSWORD \
                        SECRET_JWT=\$SECRET_JWT \
                        DB_DATABASE=\$DB_DATABASE \
                        DB_NAME=\$DB_NAME \
                        ./apps/cart-service/deploy.sh
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Despliegue exitoso en ${env.DEPLOY_ENV}"
        }
        failure {
            echo "El despliegue en ${env.DEPLOY_ENV} ha fallado"
        }
    }
}
