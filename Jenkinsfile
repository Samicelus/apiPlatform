pipeline {
    agent {node {label 'docker'}}
    environment {
        registry="harbor.mobimedical.cn/rd/api-platform"
        registryCredential='dc2778d7-7e11-4f42-b8b5-319005824868'
        dockerImage=''
        repoName='consultModulation'
        workDir="/data/jenkins/im-module"
        gitRepo="git@gitlab.mobimedical.cn:xusiyuan/consultModulation.git"
    }
    stages {
        stage('Prepare'){
            steps{
                dir("${workDir}"){
                    sh """
                        echo "[INFO] 当前分支: ${gitlabTargetBranch}"
                        echo "[INFO] 在jenkins服务器上同步代码。"
                        if [ -d ${repoName} ]
                        then
                            cd ${repoName}
                            git checkout ${gitlabTargetBranch}
                            git pull origin ${gitlabTargetBranch}
                        else
                            git clone -b ${gitlabTargetBranch} "${gitRepo}" ${repoName}
                        fi
                    """
                }
            }
        }
        stage('Build'){
            steps{
                dir("${workDir}"){
                    sh """
                        echo "[INFO] 构建${gitlabTargetBranch}分支的镜像。"
                        cd ${repoName}
                        image_num=`docker images | grep "${registry}" | grep "${gitlabTargetBranch}" | grep -v grep | wc -l`
                        if [ \$image_num == 1 ];then
                            docker rmi ${registry}:${gitlabTargetBranch}
                        fi
                        docker build -t ${registry}:${gitlabTargetBranch} .
                        docker push ${registry}:${gitlabTargetBranch}
                        docker rmi ${registry}:${gitlabTargetBranch}
                    """
                }
            }
        }
        stage('Deploy'){
            steps {
                dir("${workDir}"){
                    sh """
                        echo "[INFO] 运行deploy.${gitlabTargetBranch}.sh拉取镜像和运行镜像"
                        cd ${repoName}
                        cp -f ./bin/deploy.sh ../deploy.sh
                        chmod +x ../deploy.sh
                        if [ ${gitlabTargetBranch} == "dev" ]; then
                            ./../deploy.sh 36000 root@119.29.105.164 ${gitlabTargetBranch}
                        fi
                        if [ ${gitlabTargetBranch} == "release" ]; then
                            ./../deploy.sh 22 root@119.29.227.29 ${gitlabTargetBranch}
                        fi
                        if [ ${gitlabTargetBranch} == "master" ]; then
                            ./../deploy.sh 22 root@192.168.2.16 ${gitlabTargetBranch}
                        fi
                    """
                }
            }
        }
    }
}