export class InviteUserResponseDto {
  message!: string;
  user!: {
    id: string;
    email: string;
    name: string;
    status: number;
  };
}
