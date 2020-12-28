@Library('shared-library') _
import quarticpipeline.PipelineBuilder

containerNodes = [
  Publish: [
    dir: './jenkins-scripts/',
      steps: [
        publish: [
          file_name: 'publish.sh',
          docker_image: 'quarticai/common_package:node_python_v1',
          docker_image_args: '-u root',
          final_script: 'remove_node_modules.sh'
            ]
        ]
    ]
]

pipelineBuilder = new PipelineBuilder(this, env, scm, containerNodes)
userEnv = ['RESERVE=azubuntu']

pipelineBuilder.executePipeline(userEnv)
