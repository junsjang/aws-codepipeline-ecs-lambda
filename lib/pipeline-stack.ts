import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ManualApprovalStep, ShellStep, Wave } from 'aws-cdk-lib/pipelines';
import { pipelineAppStage } from './stage-app';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class pipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'pipeline', {
      selfMutation:     true,
      crossAccountKeys: true,
      reuseCrossRegionSupportStacks: true,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection('junsjang/aws-codepipeline-ecs-lambda', 'main',{
          // You need to replace the below code connection arn:
          connectionArn: 'arn:aws:codestar-connections:ap-northeast-1:108331135934:connection/7ea71bd5-b69f-4fd7-a868-9fae0f7d9916'
        }),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ]
      }),
      synthCodeBuildDefaults: {
        rolePolicy: [
          new PolicyStatement({
            resources: [ '*' ],
            actions: [ 'sts:AssumeRole' ],
          })
      ]}
    });

    const devStage = pipeline.addStage(new pipelineAppStage(this, 'dev', {
      env: { account: '108331135934', region: 'ap-northeast-1' }
    }));
    devStage.addPost(new ManualApprovalStep('approval'));

    const rcStage = pipeline.addStage(new pipelineAppStage(this, 'rc', {
      env: { account: '509411574368', region: 'ap-northeast-1' }
    }));
    rcStage.addPost(new ManualApprovalStep('approval'));

    const prodStage = pipeline.addStage(new pipelineAppStage(this, 'prod', {
      env: { account: '108331135934', region: 'ap-northeast-2' }
    }));
  }
}
