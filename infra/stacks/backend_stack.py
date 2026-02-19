from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_apigatewayv2 as apigw,
    aws_apigatewayv2_integrations as integrations,
    RemovalPolicy,
    CfnOutput,
    Tags,
)
from constructs import Construct


class BackendStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        Tags.of(self).add("Project", "JobTracker")
        Tags.of(self).add("Environment", "Dev")

        # DynamoDB Table
        table = dynamodb.Table(
            self,
            "ApplicationsTable",
            partition_key=dynamodb.Attribute(
                name="PK",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="SK",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Lambda Function
        function = _lambda.Function(
            self,
            "BackendLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            architecture=_lambda.Architecture.ARM_64,
            code=_lambda.Code.from_inline(
                """
def handler(event, context):
    return {
        "statusCode": 200,
        "body": "Backend alive"
    }
"""
            ),
        )

        table.grant_read_write_data(function)

        # HTTP API Gateway
        api = apigw.HttpApi(
            self,
            "BackendApi",
        )

        api.add_routes(
            path="/health",
            methods=[apigw.HttpMethod.GET],
            integration=integrations.HttpLambdaIntegration(
                "HealthIntegration",
                function
            ),
        )

        # Outputs
        CfnOutput(self, "ApiUrl", value=api.url)
        CfnOutput(self, "TableName", value=table.table_name)