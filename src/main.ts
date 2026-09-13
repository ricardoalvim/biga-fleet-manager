import { NestFactory } from '@nestjs/core'
import { StandardSchemaValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableShutdownHooks()
  app.useGlobalPipes(new StandardSchemaValidationPipe())

  const config = new DocumentBuilder()
    .setTitle('Biga Fleet Manager')
    .setDescription('PIMS de frotas — ingestão IoT e gestão relacional multi-tenant')
    .setVersion('2.0')
    .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header' }, 'tenant')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`[Fleet] API na porta ${port}`)
  console.log(`[Fleet] Documentação: http://localhost:${port}/api/docs`)
}

void bootstrap()
