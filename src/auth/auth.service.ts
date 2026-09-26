import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/dto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  private sign(user: { id: string; email: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  async register(dto: RegisterDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists)
      throw new ConflictException('ამ ელფოსტით მომხმარებელი უკვე არსებობს');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({ ...dto, password: hash });

    return {
      token: this.sign({ id: user.id, email: user.email }),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('ელფოსტა ან პაროლი არასწორია');
    }

    return {
      token: this.sign({ id: user.id, email: user.email }),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
