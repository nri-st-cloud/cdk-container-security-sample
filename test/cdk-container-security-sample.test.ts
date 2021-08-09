import '@aws-cdk/assert/jest';
import * as cdk from '@aws-cdk/core';
import {CdkContainerSecuritySampleStack} from '../lib/cdk-container-security-sample-stack';

test('Basic Test', () => {
  const app = new cdk.App();
  const stack = new CdkContainerSecuritySampleStack(app, 'stack');
  
  expect(stack).toHaveResourceLike('AWS::EC2::VPC', {
    "CidrBlock": "10.0.0.0/16"
  });
  expect(stack).toHaveResourceLike('AWS::EC2::Subnet', {
    "CidrBlock": "10.0.0.0/24"
  });
  expect(stack).toHaveResourceLike('AWS::EC2::Subnet', {
    "CidrBlock": "10.0.1.0/24"
  });
  expect(stack).toHaveResourceLike('AWS::EC2::Subnet', {
    "CidrBlock": "10.0.2.0/24"
  });
  expect(stack).toHaveResourceLike('AWS::EC2::Subnet', {
    "CidrBlock": "10.0.3.0/24"
  });
  expect(stack).toHaveResourceLike('AWS::EKS::Nodegroup');
  expect(stack).toHaveResourceLike('AWS::RDS::DBInstance');
  
});
