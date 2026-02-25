#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.backend_stack import BackendStack
from stacks.frontend_stack import FrontendStack

app = cdk.App()

BackendStack(
    app,
    "BackendStack",
)
FrontendStack(
    app,
    "FrontendStack",
)

app.synth()
