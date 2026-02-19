from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_apigatewayv2 as apigw,
    aws_apigatewayv2_integrations as integrations,
    RemovalPolicy,
    CfnOutput,
    Tags,
    aws_cognito as cognito,
    aws_apigatewayv2_authorizers as authorizers,
    aws_logs as logs,
)
from constructs import Construct
from pathlib import Path


LAMBDA_SRC_DIR = str(Path(__file__).resolve().parents[2] / "services" / "api" / "src")


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

        # Cognito User Pool
        user_pool = cognito.UserPool(
            self,
            "JobTrackerUserPool",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
        )

        user_pool_client = cognito.UserPoolClient(
            self,
            "JobTrackerUserPoolClient",
            user_pool=user_pool,
            auth_flows=cognito.AuthFlow(user_password=True),
        )

        # Lambda Function
        function = _lambda.Function(
            self,
            "BackendLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="app.handler",
            architecture=_lambda.Architecture.ARM_64,
            code=_lambda.Code.from_asset(LAMBDA_SRC_DIR),
            environment={
                "TABLE_NAME": table.table_name,
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        table.grant_read_write_data(function)

        # HTTP API Gateway
        api = apigw.HttpApi(
            self,
            "BackendApi",
        )

        jwt_authorizer = authorizers.HttpJwtAuthorizer(
            "JwtAuthorizer",
            jwt_issuer=user_pool.user_pool_provider_url,
            jwt_audience=[user_pool_client.user_pool_client_id],
        )

        api.add_routes(
            path="/health",
            methods=[apigw.HttpMethod.GET],
            integration=integrations.HttpLambdaIntegration(
                "HealthIntegration",
                function
            ),
            authorizer=jwt_authorizer,
        )

        # Outputs
        CfnOutput(self, "ApiUrl", value=api.url)
        CfnOutput(self, "TableName", value=table.table_name)
        CfnOutput(self, "UserPoolId", value=user_pool.user_pool_id)
        CfnOutput(self, "UserPoolClientId", value=user_pool_client.user_pool_client_id)