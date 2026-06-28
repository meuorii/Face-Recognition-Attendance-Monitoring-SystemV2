import StudentRegisterFaceComponent from "../components/Auth/StudentRegisterFaceComponent";

function StudentRegister() {
  return (
    <div className="w-full min-h-screen bg-[#F5F3F0] p-4 md:px-8 md:py-10 box-border antialiased selection:bg-[#008C45]/20">
      <div className="max-w-7xl mx-auto box-border">
        <StudentRegisterFaceComponent />
      </div>
    </div>
  );
}

export default StudentRegister;